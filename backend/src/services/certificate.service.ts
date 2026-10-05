import Certificate from "../models/certificate.model.js";
import Category from "../models/category.model.js";
import Enrollment from "../models/enrollment.model.js";
import User from "../models/user.model.js";
import { createNotification } from "./notification.service.js";
import { badRequest, notFound } from "../middleware/error.middleware.js";
import type { ICertificate } from "../models/certificate.model.js";
import crypto from "crypto";

const generateCertificateNumber = (slug: string): string => {
  const year = new Date().getFullYear();
  const slugPart =
    slug
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 6)
      .toUpperCase() || "CAT";
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `GYGI-${year}-${slugPart}-${random}`;
};

/**
 * Issue a certificate for a completed enrollment (idempotent).
 * Snapshots student full name, category, and enrollment dates onto the record.
 */
export const issueCertificate = async (
  studentId: string,
  categoryId: string,
  enrollmentId: string,
): Promise<ICertificate | null> => {
  const [category, student, enrollment] = await Promise.all([
    Category.findById(categoryId),
    User.findById(studentId).select("name email"),
    Enrollment.findById(enrollmentId),
  ]);

  if (!category) throw notFound("Category not found");
  if (!student) throw notFound("Student not found");
  if (!enrollment) throw notFound("Enrollment not found");

  if (!category.certificateEnabled) {
    return null;
  }

  const title = category.certificateTitle?.trim();
  if (!title) {
    throw badRequest(
      "Category is missing a certificate title. Set one before issuing certificates.",
    );
  }

  const studentFullName = student.name?.trim();
  if (!studentFullName) {
    throw badRequest("Student full name is required to issue a certificate");
  }

  const existing = await Certificate.findOne({ enrollment: enrollmentId });
  if (existing) return existing;

  const completedAt = enrollment.completedAt || new Date();

  const certificate = await Certificate.create({
    student: studentId,
    category: categoryId,
    enrollment: enrollmentId,
    certificateNumber: generateCertificateNumber(category.slug),
    title,
    studentFullName,
    studentEmail: student.email,
    categoryName: category.name,
    categoryDescription: category.description || null,
    enrolledAt: enrollment.enrolledAt,
    completedAt,
    durationWeeks: category.durationWeeks ?? null,
    phaseEndsAt: enrollment.phaseEndsAt ?? null,
    issuedAt: new Date(),
    status: "issued",
  });

  await createNotification({
    user: studentId,
    type: "announcement",
    title: "Certificate Issued",
    message: `You earned a certificate for completing ${category.name}`,
    link: `/certificates/${certificate._id}`,
    metadata: {
      categoryId,
      certificateId: certificate._id.toString(),
    },
  });

  return certificate;
};

/**
 * List certificates for a student
 */
export const getStudentCertificates = async (
  studentId: string,
): Promise<ICertificate[]> => {
  return Certificate.find({ student: studentId, status: "issued" })
    .populate("category", "name slug icon bannerImage description")
    .sort({ issuedAt: -1 });
};

/**
 * Get a single certificate (student or admin)
 */
export const getCertificateById = async (
  certificateId: string,
  requesterId: string,
  requesterRole: string,
): Promise<ICertificate> => {
  const certificate = await Certificate.findById(certificateId)
    .populate("category", "name slug icon bannerImage description")
    .populate("student", "name email avatar")
    .populate("enrollment", "enrolledAt completedAt progress status phaseEndsAt");

  if (!certificate) {
    throw notFound("Certificate not found");
  }

  const studentId =
    typeof certificate.student === "object" && certificate.student !== null
      ? String((certificate.student as { _id: unknown })._id)
      : String(certificate.student);

  if (requesterRole !== "admin" && studentId !== requesterId) {
    throw badRequest("Not authorized to view this certificate");
  }

  return certificate;
};

/**
 * Admin revoke
 */
export const revokeCertificate = async (
  certificateId: string,
): Promise<ICertificate> => {
  const certificate = await Certificate.findByIdAndUpdate(
    certificateId,
    { status: "revoked", revokedAt: new Date() },
    { new: true },
  );

  if (!certificate) {
    throw notFound("Certificate not found");
  }

  return certificate;
};

/**
 * Ensure enrollment is completed before issuing
 */
export const issueForCompletedEnrollment = async (
  studentId: string,
  categoryId: string,
): Promise<ICertificate | null> => {
  const enrollment = await Enrollment.findOne({
    student: studentId,
    category: categoryId,
    status: "completed",
  });

  if (!enrollment) return null;

  return issueCertificate(studentId, categoryId, enrollment._id.toString());
};
