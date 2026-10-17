# Data models

All models are Mongoose schemas in `backend/src/models`. MongoDB collection names follow Mongoose defaults unless a schema sets `collection`.

Ids are ObjectIds. Timestamps below are stored when the schema enables them (`createdAt`, `updatedAt`).

## User

Collection: users. File: `user.model.ts`.

Roles: `student`, `tutor`, `mentor`, `writer`, `admin`, `super_admin`. Default is student.

Identity and profile: `name`, `email` (unique), `password` (select: false, min 6), `avatar`, `coverImage`, `bio`, `phone`, `socialLinks`, `dashboardTheme`, community chat theme and wallpaper.

Learning links: `categories`, `assignedCategories`.

Profile extras: `avatarUpdatedAt`, `coverImageUpdatedAt`, `communityChatTheme`, `communityChatWallpaper`, `communityChatWallpaperUpdatedAt`, `dashboardTheme`.

Account state: `isActive`, `emailVerified`, `emailVerifiedAt`, `emailVerificationToken`, `failedLoginAttempts`, `lockedUntil`, `deletedAt`, `sessionsRevokedAt`, `lastLoginAt`, `lastPasswordChange`, `resetPasswordToken`, `resetPasswordExpire`.

Moderation: `moderationStatus` (`clear`, `warned`, `suspended`, `banned`, `muted`), `strikeCount`, `bannedAt`, `banReason`, `suspendUntil`, `suspendReason`, `mutedUntil`.

Other: `capabilities` (super-admin tools), `categoryChangeLockedUntil`, `pushSubscriptions`, `notificationPrefs`.

Password is hashed. `matchPassword` compares a login attempt. Photo changes can be locked for about 30 days; a super admin can override that lock.

## Category

Program. `name`, `slug`, `description`, `icon`, `bannerImage`, `isActive`, `durationWeeks`, `metadata` (includes `color`, `tags`, `level`, and `prerequisites`).

Membership arrays: `tutors`, `mentors`, `students`. These are caches. Displayed counts are recomputed from active users and active enrollments. See `docs/IMPLEMENTATION.md`.

Certificate: `certificateEnabled`, `certificateTitle`, `completionRules` (`attendanceWeight`, `quizWeight`, `assignmentWeight`, `passThreshold`).

`communityId`, `createdBy`.

## Enrollment

`student`, `category`, `status` (`active`, `completed`, `dropped`, `suspended`), `enrolledAt`, `completedAt`, `droppedAt`, `phaseEndsAt`, `progress`.

Delete and suspend set an active enrollment to dropped so a stale row cannot keep a student count alive.

## Category change request

`student`, `fromCategory`, `toCategory`, `reason`, `status`, `reviewedBy`, `reviewedAt`, `reviewNote`.

## Live class and live session

`LiveClass`: `category`, `tutor`, `title`, `description`, `scheduledDate`, `duration`, `status`, `maxParticipants`, `sessionId`, `recordingId`, `isRecordable`, `createdBy`.

`LiveSession`: `classId`, `tutor`, `category`, `startedAt`, `endedAt`, `status`, `participants` (join and leave, mute, video, screen share, device), `chatMessages`, `launchedQuizzes`, `launchedPolls`, `recordingStarted`, `recordingId`, `totalDuration`, `maxParticipants`.

## Video room

General room used by classes and mentorship. `name`, `type`, `status`, `host`, `coHosts`, `participants`, `settings` (chat, screen share, recording, waiting room, mute on join, and related room switches), `sessionId`, `classId`, `mentorshipSessionId`, `roomToken`, `roomUrl`, `recording`, `breakoutRooms`, scheduled and actual start and end, `participantCount`, `maxDuration`, `isRecorded`, `isActive`, `createdBy`.

## Recording

`classId`, `sessionId`, `category`, `tutor`, `date`, `duration`, `storageUrl`, `thumbnailUrl`, `processingStatus`, `transcript`, `chapters`, `summary`, `aiNotes`, `practiceQuestions`, view and download counts, `fileSize`, `format`, `resolution`, `language`, processing errors and timestamps, `isPublic`, `tags`.

## Quiz and submission

`Quiz`: `category`, `tutor`, `title`, `description`, `questions` (type, text, options, correct answer, points, explanation, difficulty, tags), `duration`, `passingScore`, `attempts`, `startDate`, `endDate`, `isActive`, `isLiveQuiz`, `randomization`, `showAnswers`, plus stored totals (`totalPoints`, `questionCount`, `averageScore`, `completionRate`).

`QuizSubmission`: `quiz`, `student`, `answers`, `score`, `totalPoints`, `percentage`, `passed`, `attempt`, `submittedAt`, `gradedAt`, `feedback`.

## Assignment and submission

`Assignment`: `category`, `tutor`, `title`, `description`, `dueDate`, `maxScore`, `submissionTypes`, `isActive`.

`AssignmentSubmission`: `assignment`, `student`, `submissionType`, `content`, `attachments`, `submittedAt`, `status`, `score`, `feedback`, `gradedBy`, `gradedAt`, `resubmittedAt`, `resubmissionCount`, `isLate`, `plagiarismScore`.

## Attendance

`classId`, `sessionId`, `student`, `category`, `joinedAt`, `leftAt`, `attendancePercentage`, `status`, `markedBy`.

## Certificate

`student`, `category`, `enrollment`, `certificateNumber`, `title`, `studentFullName`, `studentEmail`, `categoryName`, `categoryDescription`, `enrolledAt`, `completedAt`, `durationWeeks`, `phaseEndsAt`, `issuedAt`, `status`, `revokedAt`.

## Mentorship

`MentorAssignment`: `mentor`, `category`, `mentees`, `maxMentees`, `isActive`.

`MentorshipSession`: `mentor`, `mentee`, `category`, `type`, `topic`, `description`, `scheduledDate`, `duration`, `status`, `notes`, `recordingUrl`, `meetingUrl`, `meetingPlatform`, reminder flags, `cancellationReason`, `cancelledBy`.

`MentorshipGoal`: `mentor`, `mentee`, `category`, `title`, `description`, `targetDate`, `milestones` (`title`, `completed`, `completedAt`), `status`.

`MentorFeedback`: `mentor`, `mentee`, `category`, `projectTitle`, skill scores (`technicalSkills`, `uiUx`, `problemSolving`, `communication`, `overall`), `feedback`, `recommendations`.

`MentorNote`: `content`, `isPrivate`, optional `sessionId`.

## Community

`Community`: `category`, `members`, `channels` (name, type, owner, participants), `isActive`, `createdBy`.

`CommunityMessage`: `community`, `channel`, `user`, `content`, `attachments`, `isAnnouncement`, `isPinned`, `replyTo`, `forwardedFrom`, `deletedFor`, `starredBy`, `reactions`, `reports`, `editedAt`, `deletedAt`.

`CommunityChannelRead`: `user`, `community`, `channel`, `lastReadAt`.

## Official messages

`OfficialMessageThread`: `targetUser`, `actor`, `moderationAction`, `subject`, `status`, `messages` (`sender`, `senderRole`, `senderName`, `body`, `createdAt`), `lastMessageAt`.

## Moderation

`ModerationAction`: `targetUser`, `actor`, `type`, `severity`, `reason`, `internalNote`, optional message title and body, `startsAt`, `endsAt`, `status`, `strikeDelta`.

## Finance

Cleared independently of users and classes.

`Fee`: `student`, `amount`, `dueDate`, `status`, `paymentDate`, `academicYear`, `description`.

`Expense`: `date`, `category` (expense category label, not a learning Category), `description`, `amount`, `academicYear`.

`Salary`: `employee`, `amount`, `month`, `year`, `status`, `paymentDate`, `academicYear`.

## Content

`BlogPost`: `title`, `slug`, `excerpt`, `content`, `coverImage`, `category`, `tags`, `status`, `author`, `publishedAt`, SEO fields, `viewCount`.

`AboutPage`: `status`, `sections`, SEO fields, `updatedBy`, `publishedAt`.

`Topic`: `title`, `outline`, `content`, `createdBy`, `isActive`.

`Testimonial`: public story fields plus `student`, `status`, `isFeatured`, `sortOrder`.

`TestimonialComment`: `testimonial`, `authorName`, `body`, `isHidden`, `adminReply` (`body`, `authorName`, `repliedBy`, `repliedAt`).

`TestimonialLike`: `testimonial`, `clientKey`.

## Platform

`AcademicYear`: `name`, `startDate`, `endDate`, `isActive`.

`ActivityLog`: `user`, `action`, `details`, `resourceType`, `resourceId`, `metadata`, `ipAddress`, `userAgent`, `isAudit`. Finance clears log section and count here, not amounts.

`Notification`: `user`, `type`, `title`, `message`, `link`, `isRead`, `readAt`, `metadata`.

`PlatformSettings`: singleton-style school profile, notification switches, security policy, and `rolePermissions`.

`PlatformControl`: `maintenanceMode`, `maintenanceMessage`, banner fields, `featureFlags`, `scheduledMaintenance`, `ipBlocklist`, `emailBlocklist`, `killSwitches`, `experiments`, `staffChangelog`, `reportPresets`, `webhooks`, `updatedBy`.

`SupportTicket`: `subject`, `body`, `status`, `priority`, `requesterName`, `requesterEmail`, `user`, `assignedTo`, `slaDueAt`.

`Inquiry`: public interest form. `name`, `email`, `interest`, `status`.

`PortfolioReview`: student portfolio URL, `status`, `feedback`, `reviewer`.

`Team`: `name`, `logo`, `members`, `createdBy`.

`Visual`: generated image. `prompt`, `imageUrl`, `thumbnailUrl`, `generatedBy`, `isSaved`.
