import { api } from "@/lib/api";

export type FinanceOption = { _id: string; name: string };

export async function fetchAcademicYears(): Promise<FinanceOption[]> {
  const { data } = await api.get("/academic-years");
  return data.data?.years ?? [];
}

export async function fetchUsersByRole(role: string): Promise<FinanceOption[]> {
  const { data } = await api.get(
    `/users?role=${encodeURIComponent(role)}&limit=200`,
  );
  return (data.data?.users ?? []).map((u: { _id: string; name: string }) => ({
    _id: u._id,
    name: u.name,
  }));
}

export async function fetchSalaryEmployees(): Promise<FinanceOption[]> {
  const [tutors, mentors] = await Promise.all([
    fetchUsersByRole("tutor"),
    fetchUsersByRole("mentor"),
  ]);
  const byId = new Map<string, FinanceOption>();
  for (const u of [...tutors, ...mentors]) {
    byId.set(u._id, u);
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}
