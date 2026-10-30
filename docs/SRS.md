# Software Requirements Specification (SRS)
**Team name:** SENG383-SECTION1-Yigit-Beyzanur
**Version:** First version (Week 6)
**Last updated:** 2026-10-29

---

## 1. Introduction
The purpose of this Software Requirements Specification (SRS) is to clarify the functional and non-functional requirements of the AI-Assisted Child Development Platform. This document describes the expected system behavior, user roles, access restrictions, and acceptance criteria that will be used to verify the implementation.

The AI-Assisted Child Development Platform is a web-based decision support system designed to bring together parents, specialists, and children in a shared environment for tracking child development.
The system provides the following capabilities:
User authentication and role-based access.
Linking and unlinking specialists to children.
Managing weekly schedules and assigned tasks.
Recording specialist observations.
Uploading, listing, and downloading documents.
Displaying weekly task completion statistics.
Generating role-based AI summaries of weekly records.
The platform uses AI to summarize information and support human decision-making. It does not make decisions or provide diagnoses or treatment recommendations.
The application will use React (Vite) for the frontend, Node.js and Express for the backend, and SQLite for data storage. Authentication will use JSON Web Tokens (JWT). Only synthetic data will be used during development and testing.

Users of the system and abbrevations:
SRS= Software Requirements Specification
AI= Artificial Intelligence
API= Application Programming Interface
JWT= JSON Web Token
UI= User Interface
Parent= The user who owns the child's data and manages specialist links
Specialist= A professional who works with children linked to their account
Child= The user who can access their own tasks and schedule
Acceptance Criteria= Conditions that must be satisfied for a requirement to be considered fulfilled


## 2. Functional Requirements

### M1 – User Management & Authentication

As a registered user, I want to log in using my email address and password so that I can access the platform features available to my role.

FR-M1-01: User Login= The system shall allow a registered user to log in using a valid email address and password.
FR-M1-02: Invalid Login= The system shall reject login attempts with invalid credentials and shall not grant access to protected resources.
FR-M1-03: Role-Based Interface= The system shall display the interface appropriate to the authenticated user's role: Parent, Specialist, or Child.
FR-M1-04: Protected Access= The system shall prevent unauthenticated users from accessing protected application resources.

Acceptance Criteria:
A registered user with valid credentials can log in successfully.
A user who enters invalid credentials receives an appropriate error message.
An unauthenticated user cannot access protected resources.
After login, the user sees the interface corresponding to their assigned role.
Role restrictions are enforced by the backend API, not only by hiding frontend elements.

Verification 
These requirements shall be verified using automated tests for successful login, invalid credentials, unauthenticated access, and role-based access restrictions.

### M2 – Child Profile & Specialist Linking
As a parent, I want to link or unlink registered specialists to my child using their email addresses so that I can control which specialists have access to my child's information.

Functional Requirements

FR-M2-01: Link a Specialist= The system shall allow a parent to link a registered specialist to their child using the specialist's email address.
FR-M2-02: Unlink a Specialist= The system shall allow a parent to remove a previously linked specialist from their child's account.
FR-M2-03: Restrict Unlinked Specialist Access= The system shall prevent specialists who are not linked to a child from accessing that child's data.
FR-M2-04: Enforce Authorization in the Backend=The system shall verify specialist-child relationships in the backend API before granting access to child-related data.

Acceptance Criteria
A parent can successfully link a registered specialist using a valid email address.
A parent can unlink a previously linked specialist.
A linked specialist can access the data of the child they are linked to, subject to the applicable role permissions.
An unlinked specialist cannot access the child's data.
Removing a specialist link immediately prevents further authorized access through the backend API.
A specialist cannot gain access to a child simply by knowing the child's identifier.

Verification
These requirements shall be verified using automated API tests for linking, unlinking, and access control. Tests shall confirm that linked specialists can access authorized child data and unlinked specialists cannot.

### M3 – Task & Schedule Management
As a parent or a linked specialist, I want to add events to a child's weekly schedule so that the child's activities can be organized and viewed in one place.

As a child, I want to view my weekly schedule so that I can see my planned activities.

Functional Requirements

FR-M3-01: Add Schedule Events= The system shall allow a parent to add events to their child's weekly schedule.
FR-M3-02: Specialist Event Creation= The system shall allow a specialist linked to a child to add events to that child's weekly schedule.
FR-M3-03: Weekly Schedule View= The system shall display schedule events in a weekly calendar view.
FR-M3-04: Child Schedule Access= The system shall allow a child to view their own schedule.
FR-M3-05: Schedule Access Control= The system shall prevent users from adding events to or accessing schedules of children they are not authorized to access.

Acceptance Criteria:
A parent can add an event to their child's schedule.
A specialist linked to a child can add an event to that child's schedule.
Events are displayed in the weekly schedule view.
A child can view their own weekly schedule.
A specialist who is not linked to a child cannot add events to or access that child's schedule.
Users cannot access another child's schedule without the required permissions.

Verification
These requirements shall be verified using automated tests for event creation, weekly schedule display, and role-based schedule access. Tests shall include both authorized and unauthorized access attempts.

### M4 – Development Progress Tracking
As a parent or a linked specialist, I want to assign tasks to a child so that the child's activities and responsibilities can be organized.

As a child, I want to mark my assigned tasks as completed so that the person who assigned the task can track my progress.

Functional Requirements
FR-M4-01: Assign Tasks= The system shall allow a parent to assign tasks to their child.
FR-M4-02: Specialist Task Assignment= The system shall allow a specialist linked to a child to assign tasks to that child.
FR-M4-03: View Assigned Tasks= The system shall allow a child to view their own assigned tasks.
FR-M4-04: Mark Tasks as Completed= The system shall allow a child to mark an assigned task as completed.
FR-M4-05: Track Task Status= The system shall allow the user who assigned a task to view its completion status.
FR-M4-06: Task Access Control= The system shall prevent unauthorized users from assigning, viewing, or modifying tasks belonging to a child they are not authorized to access.

Acceptance Criteria
A parent can assign a task to their child.
A specialist linked to a child can assign a task to that child.
A child can view their own assigned tasks.
A child can mark an assigned task as completed.
The task completion status is visible to the user who assigned the task.
An unlinked specialist cannot assign tasks to or access tasks belonging to that child.
A user cannot access another child's tasks without the required permissions.

Verification
These requirements shall be verified using automated tests for task assignment, task listing, task completion, status tracking, and role-based access control. Tests shall include authorized and unauthorized access attempts.


### M5 – Specialist Consultation & Notes
As a specialist linked to a child, I want to create and update dated observation entries so that relevant information about the child's development can be recorded and reviewed.

As a parent, I want to access records related to my child so that I can follow the information recorded by specialists.

Functional Requirements

FR-M5-01: Create Observation Entries= The system shall allow a specialist linked to a child to create an observation entry for that child.
FR-M5-02: Date Observation Entries= The system shall associate a date with each observation entry.
FR-M5-03: Edit Observation Entries= The system shall allow a specialist to edit an existing observation entry.
FR-M5-04: Mark Edited Entries= The system shall mark an observation entry as "edited" when it has been modified.
FR-M5-05: Restrict Child Access=The system shall prevent child users from viewing specialist observation entries.
FR-M5-06: Enforce Specialist Access Control= The system shall prevent specialists from creating or accessing observation entries for children they are not linked to.

Acceptance Criteria
A specialist linked to a child can create an observation entry for that child.
Each observation entry has an associated date.
A specialist can edit an existing observation entry.
An edited observation entry is visibly marked as "edited".
A child user cannot view specialist observation entries.
An unlinked specialist cannot create or access observation entries for a child.
Parent access to their child's records follows the parent data-access permissions defined by the system.

Verification
These requirements shall be verified using automated tests for observation creation, date association, editing, edited status, and role-based access restrictions. Tests shall confirm that child users and unlinked specialists cannot access restricted observation entries.

### M6 – Media & Document Attachments

As a parent or a specialist linked to a child, I want to upload, list, and download documents related to the child so that relevant files can be stored and accessed through the platform.

Functional Requirements
FR-M6-01: Upload Documents
The system shall allow authorized users to upload documents related to a child.
FR-M6-02: Supported File Types
The system shall support PDF files and image files for document uploads.
FR-M6-03: List Documents
The system shall allow authorized users to view a list of documents associated with a child.
FR-M6-04: Download Documents
The system shall allow authorized users to download documents associated with a child.
FR-M6-05: Restrict Child Access
The system shall prevent child users from accessing uploaded documents.
FR-M6-06: Enforce Document Access Control
The system shall verify user permissions before allowing document upload, listing, or download operations.

Acceptance Criteria
An authorized user can upload a PDF document.
An authorized user can upload an image file.
Uploaded documents appear in the document list for authorized users.
An authorized user can download an uploaded document.
Child users cannot list or download uploaded documents.
Specialists cannot access documents belonging to children they are not linked to.
Unauthorized document operations are rejected by the backend.

Verification
These requirements shall be verified using automated tests for PDF and image uploads, document listing, document downloads, and role-based access restrictions. Tests shall include unauthorized access attempts.

### M7 – Weekly Task Completion Statistics

As a parent, I want to view weekly task completion statistics so that I can monitor the child's task completion progress overall and across different development areas.

Functional Requirements

FR-M7-01: Select Week= The system shall allow the user to select a week for viewing task completion statistics.
FR-M7-02: Calculate Overall Completion Rate= The system shall calculate the overall task completion rate for the selected week.
FR-M7-03: Display Overall Statistics= The system shall display the overall task completion rate for the selected week.
FR-M7-04: Calculate Completion Rate by Development Area= The system shall calculate task completion rates separately for each development area for the selected week.
FR-M7-05: Display Area-Based Statistics= The system shall display task completion statistics for each development area for the selected week.

Acceptance Criteria
A user can select a week to view its statistics
The system calculates the overall task completion rate for the selected week.
The overall completion rate is displayed to the user.
The system calculates completion rates separately for each development area.
Statistics are displayed for each development area.
Changing the selected week updates the displayed statistics.
Statistics are calculated using tasks associated with the selected week.

Verification
These requirements shall be verified using automated tests with sample task data. Tests shall check the overall completion rate, completion rates by development area, and whether changing the selected week updates the results correctly.

### M8 – Analytics & Summary Reporting
As a parent or a specialist, I want to receive an AI-generated summary of the child's weekly records based on my role so that I can better understand the recorded information and support informed decision-making.

Functional Requirements

FR-M8-01: Generate Weekly AI Summary= The system shall generate a summary of the records available for the selected week.
FR-M8-02: Role-Based Summary Generation= The system shall use separate prompts to generate summaries appropriate to the parent and specialist roles.
FR-M8-03: Enforce Data Access Permissions= The system shall provide the AI module only with records that the requesting user is authorized to access.
FR-M8-04: Identify AI-Generated Content= The system shall clearly label AI-generated summaries as "AI-generated".
FR-M8-05: Link Summary to Source Records= The system shall provide links to the source records used to generate the summary.
FR-M8-06: Human Decision-Making= The system shall present AI summaries as suggestions to support human decision-making. The AI module shall not make decisions, provide diagnoses, or recommend treatments.

Acceptance Criteria
The system can generate a summary of records for a selected week.
Parent and specialist users receive summaries generated using their respective role-based prompts.
The AI module receives only records that the requesting user is authorized to access.
Every generated summary is clearly labeled as "AI-generated".
Users can access the source records linked to the summary, subject to their permissions.
AI summaries are presented as suggestions rather than decisions.
The AI module does not provide diagnoses or treatment recommendations.

Verification 
These requirements shall be verified using automated tests with mock AI responses. Tests shall check weekly summary generation, role-specific prompts, data access restrictions, AI-generated labels, source record links, and restrictions against decision-making, diagnosis, and treatment recommendations.
---

## 3. Non-Functional Requirements
NFR-01 – Security: The system shall enforce authentication and role-based access control through the backend API.

NFR-02 – Data Privacy: The development and testing environments shall use synthetic data only.

NFR-03 – AI Safety: AI-generated summaries shall support human decision-making and shall not provide diagnoses or treatment recommendations.

NFR-04 – AI Testing: The AI integration shall provide a mock mode for automated tests and CI workflows.

NFR-05 – Technology: The system shall use React (Vite), Node.js, Express, SQLite, and JWT authentication.

## 4. Critical Flows and Acceptance Criteria

Flow 1: Specialist Linking and Access Control
Related requirements: FR-M2-01, FR-M2-02, FR-M2-03, FR-M2-04

Acceptance Criteria:
Given a parent is logged in and a registered specialist has an account,
When the parent links the specialist to their child using the specialist's email address,
Then the specialist shall be able to access the linked child's data according to their role permissions.
Given a specialist is currently linked to a child,
When the parent removes the specialist's link,
Then the specialist shall immediately lose access to that child's data through the backend API.
Flow 2: Task Assignment and Completion
Related requirements: FR-M4-01, FR-M4-02, FR-M4-03, FR-M4-04, FR-M4-05, FR-M4-06

Acceptance Criteria:
Given a parent or a specialist linked to a child is logged in,
When they create and assign a task to the child,
Then the task shall appear in the child's assigned task list.
Given a child is logged in and has an assigned task,
When the child marks the task as completed,
Then the task status shall be updated to completed.
And the user who assigned the task shall be able to view its updated completion status.
And unauthorized users shall not be able to access or modify the child's tasks.

Flow 3: Weekly Progress Review and AI Summary
Related requirements: FR-M7-01, FR-M7-02, FR-M7-03, FR-M7-04, FR-M7-05, FR-M8-01, FR-M8-02, FR-M8-03, FR-M8-04, FR-M8-05, FR-M8-06

Acceptance Criteria:
Given a parent is logged in and weekly task records exist for their child,
When the parent selects a specific week,
Then the system shall calculate and display the overall task completion rate and completion rates for each development area.
And when the parent requests a weekly AI summary,
Then the system shall generate a summary based on the records available for the selected week.
And the generated summary shall be appropriate for the parent's role and clearly labeled as "AI-generated".
And the summary shall provide links to its source records, subject to the user's access permissions.
And the AI summary shall support human decision-making without providing diagnoses or treatment recommendations.