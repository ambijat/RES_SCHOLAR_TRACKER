const $ = (selector) => document.querySelector(selector);

const KEY = "res-scholar-tracker:entries";
const CONTEXT_KEY = "res-scholar-tracker:context";
const STUDENTS_KEY = "res-scholar-tracker:students";
const DOCUMENTS_KEY = "res-scholar-tracker:documents";
const PUBLICATIONS_KEY = "res-scholar-tracker:publications";

const FALLBACK_TEMPLATES = [
  { label: "General Follow-up", body: "Hi {{student}}, checking in on your research progress. Let me know if you need anything from my side." }
];

const GROUPS = [
  {
    name: "Academic Review",
    hex: "#ff6b5e",
    items: [
      { name: "Thesis In-Person Discussion Held", detail: "In-person thesis supervision discussion logged", type: "THESIS_IN_PERSON_DISCUSSION_HELD", mode: "Logging" },
      { name: "Chapter Outline Approved", detail: "Selected chapter outline approved; begin structure work", type: "CHAPTER_OUTLINE_APPROVED", chapter: true, mode: "Logging" },
      { name: "Chapter Midcourse Reviewed", detail: "Mid-chapter progress reviewed and returned with suggestions", type: "CHAPTER_MIDCOURSE_REVIEWED", chapter: true, mode: "Logging" },
      { name: "Chapter Draft Reviewed", detail: "Draft received and returned with corrections or clearance", type: "CHAPTER_DRAFT_REVIEWED", chapter: true, mode: "Logging" },
      { name: "Thesis Title and Chapter Scheme", detail: "Retrieve thesis title and approved chapter scheme from student CSV", type: "THESIS_TITLE_CHAPTER_SCHEME", mode: "Retrieval", retrieval: "THESIS_SCHEME" },
      { name: "Previous RAC Goals", detail: "Retrieve previous RAC goals from student record", type: "PREVIOUS_RAC_GOALS", mode: "Retrieval", retrieval: "RAC_GOALS" }
    ]
  },
  {
    name: "Financial",
    hex: "#4cc4ff",
    items: [
      { name: "HRA Bill Signed", detail: "HRA bill signature recorded", type: "HRA_SIGNED", mode: "Logging" },
      { name: "Fellowship Bill Signed", detail: "Fellowship bill signature recorded", type: "FELLOWSHIP_SIGNED", mode: "Logging" },
      { name: "Contingency Signed", detail: "Contingency claim signature recorded", type: "CONTINGENCY_SIGNED", mode: "Logging" },
      { name: "Receipt Verified", detail: "Financial receipt checked", type: "RECEIPT_VERIFIED", mode: "Logging" }
    ]
  },
  {
    name: "Admin",
    hex: "#37d68a",
    items: [
      { name: "Semester Registration Done", detail: "Semester registration completion logged", type: "SEMESTER_REGISTRATION_DONE", mode: "Logging" },
      { name: "Cohort/RAC Meeting", detail: "Formal cohort-level RAC meeting logged", type: "COHORT_MEETING", mode: "Logging" },
      { name: "Reminder Sent", detail: "Choose and send a reminder message preset", type: "REMINDER_SENT", mode: "Retrieval", retrieval: "REMINDER_MESSAGE" },
      { name: "Form Forwarded", detail: "Administrative form forwarded", type: "FORM_FORWARDED", mode: "Logging" }
    ]
  }
];

const ui = {
  clock: $("#clock"),
  studentName: $("#studentName"),
  openStudents: $("#openStudents"),
  semesterNumber: $("#semesterNumber"),
  chapterNumber: $("#chapterNumber"),
  meetingPunch: $("#meetingPunch"),
  meetingPunchState: $("#meetingPunchState"),
  lastMeeting: $("#lastMeeting"),
  openMessage: $("#openMessage"),
  entryCount: $("#entryCount"),
  groupSelector: $("#groupSelector"),
  activeGroupTitle: $("#activeGroupTitle"),
  activeGroupMeta: $("#activeGroupMeta"),
  itemSelector: $("#itemSelector"),
  snapshotAcademic: $("#snapshotAcademic"),
  snapshotFinancial: $("#snapshotFinancial"),
  snapshotGap: $("#snapshotGap"),
  snapshotDocuments: $("#snapshotDocuments"),
  snapshotPublications: $("#snapshotPublications"),
  snapshotRetrieval: $("#snapshotRetrieval"),
  history: $("#history"),
  openExport: $("#openExport"),
  exportModal: $("#exportModal"),
  closeExport: $("#closeExport"),
  formatCsv: $("#formatCsv"),
  formatJson: $("#formatJson"),
  exportText: $("#exportText"),
  copyExport: $("#copyExport"),
  downloadExport: $("#downloadExport"),
  shareExport: $("#shareExport"),
  importFile: $("#importFile"),
  studentsModal: $("#studentsModal"),
  closeStudents: $("#closeStudents"),
  studentFormName: $("#studentFormName"),
  studentFormEnrollment: $("#studentFormEnrollment"),
  studentFormSemester: $("#studentFormSemester"),
  studentFormEnrolmentNo: $("#studentFormEnrolmentNo"),
  studentFormTopic: $("#studentFormTopic"),
  studentFormChapterScheme: $("#studentFormChapterScheme"),
  studentFormNotes: $("#studentFormNotes"),
  studentFormSave: $("#studentFormSave"),
  studentsList: $("#studentsList"),
  studentsExport: $("#studentsExport"),
  studentsImportFile: $("#studentsImportFile"),
  messageModal: $("#messageModal"),
  closeMessage: $("#closeMessage"),
  messageRecipientEmail: $("#messageRecipientEmail"),
  messagePresets: $("#messagePresets"),
  toast: $("#toast"),
  toastText: $("#toastText"),
  undoLast: $("#undoLast"),
  openDocuments: $("#openDocuments"),
  documentsModal: $("#documentsModal"),
  closeDocuments: $("#closeDocuments"),
  documentFormStudent: $("#documentFormStudent"),
  documentFormSubject: $("#documentFormSubject"),
  documentFormDocType: $("#documentFormDocType"),
  documentFormVersion: $("#documentFormVersion"),
  documentFormFilename: $("#documentFormFilename"),
  documentFormSizeKb: $("#documentFormSizeKb"),
  documentFormDate: $("#documentFormDate"),
  documentFormSave: $("#documentFormSave"),
  documentsList: $("#documentsList"),
  documentsExport: $("#documentsExport"),
  documentsImportFile: $("#documentsImportFile"),
  openPublications: $("#openPublications"),
  publicationsModal: $("#publicationsModal"),
  closePublications: $("#closePublications"),
  publicationFormStudent: $("#publicationFormStudent"),
  publicationFormTitle: $("#publicationFormTitle"),
  publicationFormCoAuthors: $("#publicationFormCoAuthors"),
  publicationFormTargetJournal: $("#publicationFormTargetJournal"),
  publicationFormStage: $("#publicationFormStage"),
  publicationFormSave: $("#publicationFormSave"),
  publicationsList: $("#publicationsList"),
  publicationsExport: $("#publicationsExport"),
  publicationsImportFile: $("#publicationsImportFile"),
  noteModal: $("#noteModal"),
  closeNote: $("#closeNote"),
  noteText: $("#noteText"),
  saveNote: $("#saveNote")
};

const state = {
  entries: [],
  students: [],
  documents: [],
  publications: [],
  templates: FALLBACK_TEMPLATES,
  editingStudentId: null,
  editingDocumentId: null,
  editingPublicationId: null,
  noteEntryId: null,
  activeGroup: GROUPS[0].name,
  filter: "ALL",
  exportFormat: "CSV",
  lastLoggedId: null,
  toastTimer: null
};

const FALLBACK_STUDENTS = [];

function itemName(item) {
  return typeof item === "string" ? item : item.name;
}

function entryItem(entry) {
  return entry.item || entry.ex || "";
}

function localDateKey(value = new Date()) {
  const d = value instanceof Date ? value : new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function entryId() {
  if (globalThis.crypto && globalThis.crypto.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function storageRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function storageWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The app remains usable in memory if storage is unavailable.
  }
}

async function readBundledText(filename) {
  const bridge = nativeBridge();
  if (bridge && typeof bridge.readAsset === "function") {
    const text = bridge.readAsset(filename);
    if (typeof text === "string" && text.trim()) return text;
  }

  const response = await fetch(`./${filename}`);
  if (!response.ok) throw new Error("missing");
  return response.text();
}

function loadState() {
  state.entries = storageRead(KEY, []).map(normalizeEntry).filter(Boolean);
}

function loadStudents() {
  const saved = storageRead(STUDENTS_KEY, null);
  state.students = Array.isArray(saved) && saved.length ? saved : FALLBACK_STUDENTS.map((student) => ({ ...student }));
}

async function syncStudentsSeed() {
  try {
    const parsed = parseStudentsCsv(await readBundledText("students.csv"));
    if (!parsed.length) return;
    importStudents(parsed, { silent: true });
  } catch {
    // No repo-provided seed available - local student list stands as-is.
  }
}

function saveStudents() {
  storageWrite(STUDENTS_KEY, state.students);
}

function loadDocuments() {
  state.documents = storageRead(DOCUMENTS_KEY, null) || [];
}

function saveDocuments() {
  storageWrite(DOCUMENTS_KEY, state.documents);
}

async function syncDocumentsSeed() {
  try {
    const parsed = parseDocumentsCsv(await readBundledText("documents.csv"));
    if (!parsed.length) return;
    importDocuments(parsed, { silent: true });
  } catch {
    // No repo-provided seed available - local documents register stands as-is.
  }
}

function loadPublications() {
  state.publications = storageRead(PUBLICATIONS_KEY, null) || [];
}

function savePublications() {
  storageWrite(PUBLICATIONS_KEY, state.publications);
}

async function syncPublicationsSeed() {
  try {
    const parsed = parsePublicationsCsv(await readBundledText("publications.csv"));
    if (!parsed.length) return;
    importPublications(parsed, { silent: true });
  } catch {
    // No repo-provided seed available - local publications register stands as-is.
  }
}

function applyContext() {
  const context = storageRead(CONTEXT_KEY, {});
  if (context.studentName && state.students.some((student) => student.name === context.studentName)) {
    ui.studentName.value = context.studentName;
  }
  if (context.semesterNumber) ui.semesterNumber.value = context.semesterNumber;
  if (context.chapterNumber) ui.chapterNumber.value = context.chapterNumber;
}

function saveEntries() {
  storageWrite(KEY, state.entries);
}

function saveContext() {
  storageWrite(CONTEXT_KEY, {
    studentName: ui.studentName.value,
    semesterNumber: ui.semesterNumber.value,
    chapterNumber: ui.chapterNumber.value
  });
}

function normalizeEntry(entry) {
  if (!entry || !entry.ts) return null;
  const item = entryItem(entry);
  if (!item) return null;
  return {
    id: entry.id || entryId(),
    item,
    group: entry.group || "Imported",
    ts: entry.ts,
    student: entry.student || "",
    semester: entry.semester || "",
    chapter: entry.chapter || "",
    detail: entry.detail || "",
    type: entry.type || "IMPORTED"
  };
}

function currentContext() {
  return {
    student: ui.studentName.value.trim() || "Unknown Student",
    semester: String(Number(ui.semesterNumber.value || 1)),
    chapter: String(Number(ui.chapterNumber.value || 1))
  };
}

function currentStudentRecord() {
  const context = currentContext();
  return state.students.find((student) => student.name === context.student) || null;
}

async function refreshStudentSeed() {
  await syncStudentsSeed();
  renderStudentDropdown();
  renderMessageRecipient();
  renderAll();
}

function renderStudentDropdown() {
  const studentOptions = state.students.map((student) => `
    <option value="${escapeHtml(student.name)}">${escapeHtml(student.name)}</option>
  `).join("");
  const options = `<option value="" selected disabled>Select student</option>${studentOptions}`;

  [ui.studentName, ui.documentFormStudent, ui.publicationFormStudent].forEach((select) => {
    if (!select) return;
    const current = select.value;
    select.innerHTML = options;
    if (current && state.students.some((student) => student.name === current)) {
      select.value = current;
    } else if (select === ui.studentName) {
      select.value = "";
    }
  });
}

function renderStudentsList() {
  if (!state.students.length) {
    ui.studentsList.innerHTML = '<div class="empty">No students yet.</div>';
    return;
  }
  ui.studentsList.innerHTML = state.students.map((student) => {
    const meta = [
      student.semester ? `Semester ${student.semester}` : "",
      student.enrollmentDate ? `Enrolled ${student.enrollmentDate}` : "",
      student.enrolmentNo ? `No. ${student.enrolmentNo}` : ""
    ].filter(Boolean).join(" | ");
    return `
      <article class="student-row" data-id="${escapeHtml(student.id)}">
        <div>
          <strong>${escapeHtml(student.name)}</strong>
          <span>${escapeHtml(meta || "No details set")}</span>
          ${student.topic ? `<small>${escapeHtml(student.topic)}</small>` : ""}
          ${student.chapterScheme ? `<small>${escapeHtml(student.chapterScheme)}</small>` : ""}
          ${student.notes ? `<small>${escapeHtml(student.notes)}</small>` : ""}
        </div>
        <div class="student-row-actions">
          <button class="icon-button" type="button" data-edit-student="${escapeHtml(student.id)}" aria-label="Edit student">&#9998;</button>
          <button class="icon-button" type="button" data-remove-student="${escapeHtml(student.id)}" aria-label="Delete student">x</button>
        </div>
      </article>
    `;
  }).join("");
}

function clearStudentForm() {
  state.editingStudentId = null;
  ui.studentFormName.value = "";
  ui.studentFormEnrollment.value = "";
  ui.studentFormSemester.value = "";
  ui.studentFormEnrolmentNo.value = "";
  ui.studentFormTopic.value = "";
  ui.studentFormChapterScheme.value = "";
  ui.studentFormNotes.value = "";
  ui.studentFormSave.textContent = "Add Student";
}

function editStudent(id) {
  const student = state.students.find((candidate) => candidate.id === id);
  if (!student) return;
  state.editingStudentId = id;
  ui.studentFormName.value = student.name;
  ui.studentFormEnrollment.value = student.enrollmentDate || "";
  ui.studentFormSemester.value = student.semester || "";
  ui.studentFormEnrolmentNo.value = student.enrolmentNo || "";
  ui.studentFormTopic.value = student.topic || "";
  ui.studentFormChapterScheme.value = student.chapterScheme || "";
  ui.studentFormNotes.value = student.notes || "";
  ui.studentFormSave.textContent = "Update Student";
}

function removeStudent(id) {
  const student = state.students.find((candidate) => candidate.id === id);
  if (!student || !confirm(`Delete "${student.name}" from the student list?`)) return;
  state.students = state.students.filter((candidate) => candidate.id !== id);
  if (state.editingStudentId === id) clearStudentForm();
  saveStudents();
  renderStudentsList();
  renderStudentDropdown();
  renderAll();
}

function saveStudentForm() {
  const name = ui.studentFormName.value.trim();
  if (!name) {
    showToast("Student name required", false);
    return;
  }
  const enrollmentDate = ui.studentFormEnrollment.value;
  const semester = ui.studentFormSemester.value ? Number(ui.studentFormSemester.value) : "";
  const enrolmentNo = ui.studentFormEnrolmentNo.value.trim();
  const topic = ui.studentFormTopic.value.trim();
  const chapterScheme = ui.studentFormChapterScheme.value.trim();
  const notes = ui.studentFormNotes.value.trim();

  if (state.editingStudentId) {
    const student = state.students.find((candidate) => candidate.id === state.editingStudentId);
    if (student) Object.assign(student, { name, enrollmentDate, semester, enrolmentNo, topic, chapterScheme, notes });
  } else {
    state.students.push({ id: entryId(), name, enrollmentDate, semester, enrolmentNo, topic, chapterScheme, notes });
  }

  saveStudents();
  clearStudentForm();
  renderStudentsList();
  renderStudentDropdown();
  renderAll();
}

function openStudentsModal() {
  clearStudentForm();
  renderStudentsList();
  ui.studentsModal.hidden = false;
}

function renderDocumentsList() {
  if (!state.documents.length) {
    ui.documentsList.innerHTML = '<div class="empty">No documents yet.</div>';
    return;
  }
  ui.documentsList.innerHTML = state.documents.map((document_) => {
    const meta = [
      document_.docType || "",
      document_.version ? `v${document_.version}` : "",
      document_.date ? document_.date : ""
    ].filter(Boolean).join(" | ");
    return `
      <article class="student-row" data-id="${escapeHtml(document_.id)}">
        <div>
          <strong>${escapeHtml(document_.subject || document_.filename || "Untitled")}</strong>
          <span>${escapeHtml(document_.student)}${meta ? ` | ${escapeHtml(meta)}` : ""}</span>
          ${document_.filename ? `<small>${escapeHtml(document_.filename)}${document_.sizeKb ? ` (${escapeHtml(String(document_.sizeKb))} KB)` : ""}</small>` : ""}
        </div>
        <div class="student-row-actions">
          <button class="icon-button" type="button" data-edit-document="${escapeHtml(document_.id)}" aria-label="Edit document">&#9998;</button>
          <button class="icon-button" type="button" data-remove-document="${escapeHtml(document_.id)}" aria-label="Delete document">x</button>
        </div>
      </article>
    `;
  }).join("");
}

function clearDocumentForm() {
  state.editingDocumentId = null;
  ui.documentFormSubject.value = "";
  ui.documentFormDocType.value = "";
  ui.documentFormVersion.value = "";
  ui.documentFormFilename.value = "";
  ui.documentFormSizeKb.value = "";
  ui.documentFormDate.value = "";
  ui.documentFormSave.textContent = "Add Document";
}

function editDocument(id) {
  const document_ = state.documents.find((candidate) => candidate.id === id);
  if (!document_) return;
  state.editingDocumentId = id;
  ui.documentFormStudent.value = document_.student;
  ui.documentFormSubject.value = document_.subject || "";
  ui.documentFormDocType.value = document_.docType || "";
  ui.documentFormVersion.value = document_.version || "";
  ui.documentFormFilename.value = document_.filename || "";
  ui.documentFormSizeKb.value = document_.sizeKb || "";
  ui.documentFormDate.value = document_.date || "";
  ui.documentFormSave.textContent = "Update Document";
}

function removeDocument(id) {
  const document_ = state.documents.find((candidate) => candidate.id === id);
  if (!document_ || !confirm(`Delete "${document_.subject || document_.filename}" from documents?`)) return;
  state.documents = state.documents.filter((candidate) => candidate.id !== id);
  if (state.editingDocumentId === id) clearDocumentForm();
  saveDocuments();
  renderDocumentsList();
  renderAll();
}

function saveDocumentForm() {
  const student = ui.documentFormStudent.value;
  if (!student) {
    showToast("Select a student first", false);
    return;
  }
  const record = {
    student,
    subject: ui.documentFormSubject.value.trim(),
    docType: ui.documentFormDocType.value.trim(),
    version: ui.documentFormVersion.value.trim(),
    filename: ui.documentFormFilename.value.trim(),
    sizeKb: ui.documentFormSizeKb.value ? Number(ui.documentFormSizeKb.value) : "",
    date: ui.documentFormDate.value
  };

  if (state.editingDocumentId) {
    const document_ = state.documents.find((candidate) => candidate.id === state.editingDocumentId);
    if (document_) Object.assign(document_, record);
  } else {
    state.documents.push({ id: entryId(), ...record });
  }

  saveDocuments();
  clearDocumentForm();
  renderDocumentsList();
  renderAll();
}

function openDocumentsModal() {
  clearDocumentForm();
  renderDocumentsList();
  ui.documentsModal.hidden = false;
}

function renderPublicationsList() {
  if (!state.publications.length) {
    ui.publicationsList.innerHTML = '<div class="empty">No publications yet.</div>';
    return;
  }
  ui.publicationsList.innerHTML = state.publications.map((publication) => {
    const meta = [
      publication.stage || "",
      publication.targetJournal ? `-> ${publication.targetJournal}` : "",
      publication.lastUpdate || ""
    ].filter(Boolean).join(" | ");
    return `
      <article class="student-row" data-id="${escapeHtml(publication.id)}">
        <div>
          <strong>${escapeHtml(publication.title || "Untitled")}</strong>
          <span>${escapeHtml(publication.student)}${meta ? ` | ${escapeHtml(meta)}` : ""}</span>
          ${publication.coAuthors ? `<small>Co-authors: ${escapeHtml(publication.coAuthors)}</small>` : ""}
        </div>
        <div class="student-row-actions">
          <button class="icon-button" type="button" data-edit-publication="${escapeHtml(publication.id)}" aria-label="Edit publication">&#9998;</button>
          <button class="icon-button" type="button" data-remove-publication="${escapeHtml(publication.id)}" aria-label="Delete publication">x</button>
        </div>
      </article>
    `;
  }).join("");
}

function clearPublicationForm() {
  state.editingPublicationId = null;
  ui.publicationFormTitle.value = "";
  ui.publicationFormCoAuthors.value = "";
  ui.publicationFormTargetJournal.value = "";
  ui.publicationFormStage.value = "Drafting";
  ui.publicationFormSave.textContent = "Add Publication";
}

function editPublication(id) {
  const publication = state.publications.find((candidate) => candidate.id === id);
  if (!publication) return;
  state.editingPublicationId = id;
  ui.publicationFormStudent.value = publication.student;
  ui.publicationFormTitle.value = publication.title || "";
  ui.publicationFormCoAuthors.value = publication.coAuthors || "";
  ui.publicationFormTargetJournal.value = publication.targetJournal || "";
  ui.publicationFormStage.value = publication.stage || "Drafting";
  ui.publicationFormSave.textContent = "Update Publication";
}

function removePublication(id) {
  const publication = state.publications.find((candidate) => candidate.id === id);
  if (!publication || !confirm(`Delete "${publication.title}" from publications?`)) return;
  state.publications = state.publications.filter((candidate) => candidate.id !== id);
  if (state.editingPublicationId === id) clearPublicationForm();
  savePublications();
  renderPublicationsList();
  renderAll();
}

function savePublicationForm() {
  const student = ui.publicationFormStudent.value;
  const title = ui.publicationFormTitle.value.trim();
  if (!student || !title) {
    showToast("Select a student and enter a title", false);
    return;
  }
  const record = {
    student,
    title,
    coAuthors: ui.publicationFormCoAuthors.value.trim(),
    targetJournal: ui.publicationFormTargetJournal.value.trim(),
    stage: ui.publicationFormStage.value,
    lastUpdate: localDateKey()
  };

  if (state.editingPublicationId) {
    const publication = state.publications.find((candidate) => candidate.id === state.editingPublicationId);
    if (publication) Object.assign(publication, record);
  } else {
    state.publications.push({ id: entryId(), ...record });
  }

  savePublications();
  clearPublicationForm();
  renderPublicationsList();
  renderAll();
}

function openPublicationsModal() {
  clearPublicationForm();
  renderPublicationsList();
  ui.publicationsModal.hidden = false;
}

function meetingsForStudent(student) {
  return state.entries.filter((entry) => entry.type === "RESEARCH_MEETING" && entry.student === student);
}

function todaysMeetingEntry() {
  const today = localDateKey();
  const student = currentContext().student;
  return latestOf((entry) => entry.type === "RESEARCH_MEETING" && entry.student === student && localDateKey(entry.ts) === today);
}

function toggleMeetingPunch() {
  const existing = todaysMeetingEntry();
  if (existing) {
    state.entries = state.entries.filter((entry) => entry.id !== existing.id);
    saveEntries();
    renderAll();
    showToast("Meeting un-punched", false);
    return;
  }

  const context = currentContext();
  const entry = {
    id: entryId(),
    item: "Research Meeting",
    group: "Academic Review",
    ts: new Date().toISOString(),
    student: context.student,
    semester: context.semester,
    chapter: "",
    detail: "Supervisor meeting logged",
    type: "RESEARCH_MEETING"
  };
  state.entries.push(entry);
  state.lastLoggedId = entry.id;
  saveEntries();
  renderAll();
  showToast("Meeting today logged", true);
}

function formatRelativeDate(ts) {
  const days = Math.floor((Date.now() - new Date(ts).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return localDateKey(ts);
}

function parseTemplates(text) {
  return text
    .split(/\r?\n-{3,}\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const [label, ...bodyLines] = block.split(/\r?\n/);
      return { label: (label || "").trim(), body: bodyLines.join("\n").trim() };
    })
    .filter((template) => template.label && template.body);
}

async function loadTemplates() {
  try {
    const parsed = parseTemplates(await readBundledText("message-templates.txt"));
    state.templates = parsed.length ? parsed : FALLBACK_TEMPLATES;
  } catch {
    state.templates = FALLBACK_TEMPLATES;
  }
}

function resolveTemplateBody(body) {
  return body.replace(/\{\{student\}\}/g, currentContext().student);
}

function renderMessagePresets() {
  ui.messagePresets.innerHTML = state.templates.map((template, index) => {
    const body = resolveTemplateBody(template.body);
    return `
      <button class="message-preset" type="button" data-template="${index}">
        <strong>${escapeHtml(template.label)}</strong>
        <span>${escapeHtml(body.length > 90 ? `${body.slice(0, 90)}...` : body)}</span>
      </button>
    `;
  }).join("");
}

function renderMessageRecipient() {
  if (!ui.messageRecipientEmail) return;
  const student = currentStudentRecord();
  ui.messageRecipientEmail.value = student?.email || "";
}

function escapeHtmlAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function renderRetrievalWindow(title, bodyHtml) {
  if (!ui.snapshotRetrieval) return;
  ui.snapshotRetrieval.innerHTML = `
    <div class="retrieval-window-head">
      <strong>${escapeHtml(title)}</strong>
      <span>Supervisor Snapshot</span>
    </div>
    <div class="retrieval-body">${bodyHtml}</div>
  `;
  const details = document.querySelector(".insights-panel details");
  if (details) details.open = true;
}

function openMessageModal() {
  renderMessagePresets();
  renderMessageRecipient();
  ui.messageModal.hidden = false;
}

function sendPreset(index) {
  const template = state.templates[index];
  if (!template) return;
  const text = resolveTemplateBody(template.body);
  ui.messageModal.hidden = true;
  shareText(text, template.label).catch(() => showToast("Share failed", false));
}

function renderGroups() {
  ui.groupSelector.innerHTML = GROUPS.map((group) => `
    <button class="group-button ${group.name === state.activeGroup ? "on" : ""}"
      type="button"
      data-group="${escapeHtml(group.name)}"
      style="--group-color:${group.hex}">
      ${escapeHtml(group.name)}
    </button>
  `).join("");
}

function renderItems() {
  const group = GROUPS.find((entry) => entry.name === state.activeGroup) || GROUPS[0];
  const loggingCount = group.items.filter((item) => (item.mode || "Logging") === "Logging").length;
  const retrievalCount = group.items.filter((item) => item.mode === "Retrieval").length;
  ui.activeGroupTitle.textContent = `${group.name} Workflow`;
  ui.activeGroupMeta.textContent = `${loggingCount} logging, ${retrievalCount} retrieval`;
  ui.itemSelector.innerHTML = ["Logging", "Retrieval"].map((mode) => {
    const items = group.items.filter((item) => (item.mode || "Logging") === mode);
    if (!items.length) return "";
    const buttons = items.map((item) => `
      <button class="item-button ${mode === "Retrieval" ? "retrieval-item" : ""}"
        type="button"
        data-item="${escapeHtml(itemName(item))}"
        style="--item-color:${group.hex}">
        <strong>${escapeHtml(itemName(item))}</strong>
        <span>${escapeHtml(item.detail || "Tap to log")}</span>
      </button>
    `).join("");
    return `
      <div class="item-section">
        <h3>${mode}</h3>
        <div class="item-section-grid">${buttons}</div>
      </div>
    `;
  }).join("");
}

function findActiveItem(itemLabel) {
  const group = GROUPS.find((entry) => entry.name === state.activeGroup);
  if (!group) return null;
  return group.items.find((candidate) => itemName(candidate) === itemLabel) || null;
}

function retrievalParagraph(label, value) {
  return `
    <article class="retrieval-row">
      <strong>${escapeHtml(label)}</strong>
      <p>${escapeHtml(value || "Not on file")}</p>
    </article>
  `;
}

function openRetrieval(item) {
  const student = currentStudentRecord();
  const studentName = currentContext().student;
  if (!student) {
    renderRetrievalWindow(itemName(item), `<div class="empty">No student record found for ${escapeHtml(studentName)}.</div>`);
    return;
  }

  if (item.retrieval === "THESIS_SCHEME") {
    renderRetrievalWindow(itemName(item), [
      retrievalParagraph("Student", student.name),
      retrievalParagraph("Thesis Title", student.topic || student.thesisTitle),
      retrievalParagraph("Chapter Scheme", student.chapterScheme || "Not yet available in students.csv. Add a ChapterScheme column from the synopsis database export.")
    ].join(""));
  } else if (item.retrieval === "RAC_GOALS") {
    renderRetrievalWindow(itemName(item), [
      retrievalParagraph("Student", student.name),
      retrievalParagraph("Previous RAC Goals", student.notes || "No RAC goals are recorded in the student CSV notes.")
    ].join(""));
  } else if (item.retrieval === "REMINDER_MESSAGE") {
    renderRetrievalWindow(itemName(item), [
      retrievalParagraph("Sent Message", "Choose a preset to send the reminder message."),
      `<div class="message-list">${state.templates.map((template, index) => {
        const body = resolveTemplateBody(template.body);
        return `
          <button class="message-preset" type="button" data-template="${index}">
            <strong>${escapeHtml(template.label)}</strong>
            <span>${escapeHtml(body.length > 90 ? `${body.slice(0, 90)}...` : body)}</span>
          </button>
        `;
      }).join("")}</div>`
    ].join(""));
  } else {
    renderRetrievalWindow(itemName(item), `<div class="empty">No retrieval view is configured for this action yet.</div>`);
  }
}

function handleItemAction(itemLabel) {
  const item = findActiveItem(itemLabel);
  if (!item) return;
  if (item.mode === "Retrieval") {
    openRetrieval(item);
    return;
  }
  logItem(state.activeGroup, itemLabel);
}

function logItem(groupName, itemLabel) {
  const group = GROUPS.find((entry) => entry.name === groupName);
  const item = group.items.find((candidate) => itemName(candidate) === itemLabel);
  const context = currentContext();
  const entry = {
    id: entryId(),
    item: itemName(item),
    group: group.name,
    ts: new Date().toISOString(),
    student: context.student,
    semester: context.semester,
    chapter: item.chapter ? context.chapter : "",
    detail: item.detail || "",
    type: item.type || itemName(item).toUpperCase().replace(/\W+/g, "_")
  };

  state.entries.push(entry);
  state.lastLoggedId = entry.id;
  saveEntries();
  renderAll();
  showToast(`${entry.item} logged`, true);
}

function deleteEntry(id) {
  const entry = state.entries.find((candidate) => candidate.id === id);
  if (!entry || !confirm(`Delete "${entry.item}" from history?`)) return;
  state.entries = state.entries.filter((candidate) => candidate.id !== id);
  saveEntries();
  renderAll();
}

function undoLast() {
  if (!state.lastLoggedId) return;
  state.entries = state.entries.filter((entry) => entry.id !== state.lastLoggedId);
  state.lastLoggedId = null;
  saveEntries();
  renderAll();
  hideToast();
}

function showToast(message, canUndo) {
  clearTimeout(state.toastTimer);
  ui.toastText.textContent = message;
  ui.undoLast.hidden = !canUndo;
  ui.toast.hidden = false;
  state.toastTimer = setTimeout(hideToast, 5200);
}

function hideToast() {
  ui.toast.hidden = true;
}

function entriesWithin(days) {
  const cutoff = Date.now() - (days * 86400000);
  return state.entries.filter((entry) => new Date(entry.ts).getTime() >= cutoff);
}

function visibleEntries() {
  if (state.filter === "TODAY") {
    const today = localDateKey();
    return state.entries.filter((entry) => localDateKey(entry.ts) === today);
  }
  if (state.filter === "7D") return entriesWithin(7);
  if (state.filter === "30D") return entriesWithin(30);
  return state.entries;
}

function latestOf(predicate) {
  return state.entries.slice().reverse().find(predicate);
}

function renderSummary() {
  ui.entryCount.textContent = `${state.entries.length} entries`;

  const punchedToday = Boolean(todaysMeetingEntry());
  ui.meetingPunch.classList.toggle("on", punchedToday);
  ui.meetingPunchState.textContent = punchedToday ? "Punched" : "Tap to log";

  const meetings = meetingsForStudent(currentContext().student).slice().sort((a, b) => new Date(b.ts) - new Date(a.ts));
  ui.lastMeeting.textContent = meetings.length ? formatRelativeDate(meetings[0].ts) : "No meetings yet";
}

function renderInsights() {
  const academic = state.entries.filter((entry) => entry.group === "Academic Review" || entry.group === "Academic" || entry.group === "Review");
  const financial = state.entries.filter((entry) => entry.group === "Financial");
  const approvals = academic.filter((entry) => /APPROVED|COMPLETED|READY/.test(entry.type)).length;
  const latestAcademic = latestOf((entry) => entry.group === "Academic Review" || entry.group === "Academic" || entry.group === "Review");

  ui.snapshotAcademic.textContent = academic.length
    ? `Academic Review: ${academic.length} actions, ${approvals} milestone signals.`
    : "Academic Review: no activity logged yet.";

  ui.snapshotFinancial.textContent = financial.length
    ? `Financial: ${financial.length} signed or verified records.`
    : "Financial: no activity logged yet.";

  if (!latestAcademic) {
    ui.snapshotGap.textContent = "Contact gap: waiting for first research action.";
    return;
  }

  const days = Math.floor((Date.now() - new Date(latestAcademic.ts).getTime()) / 86400000);
  ui.snapshotGap.textContent = `Contact gap: ${days} day(s) since latest research action.`;
}

function renderRegisterSnapshots() {
  const student = currentContext().student;
  const documents = state.documents.filter((document_) => document_.student === student);
  const publications = state.publications.filter((publication) => publication.student === student);

  ui.snapshotDocuments.textContent = documents.length
    ? `Documents: ${documents.length} on file, latest "${documents[documents.length - 1].subject || documents[documents.length - 1].filename}".`
    : "Documents: none on file yet.";

  ui.snapshotPublications.textContent = publications.length
    ? `Publications: ${publications.length}, latest "${publications[publications.length - 1].title}" (${publications[publications.length - 1].stage}).`
    : "Publications: none on file yet.";
}

function renderHistory() {
  const entries = visibleEntries().slice().sort((a, b) => new Date(b.ts) - new Date(a.ts));
  if (!entries.length) {
    ui.history.innerHTML = '<div class="empty">No entries in this filter.</div>';
    return;
  }

  let lastDay = "";
  ui.history.innerHTML = entries.map((entry) => {
    const day = localDateKey(entry.ts);
    const dayHead = day !== lastDay ? `<div class="history-day">${day}</div>` : "";
    lastDay = day;
    const detail = [entry.student, entry.semester ? `Semester ${entry.semester}` : "", entry.chapter ? `Chapter ${entry.chapter}` : ""]
      .filter(Boolean)
      .join(" | ");
    return `
      ${dayHead}
      <article class="log-item">
        <div>
          <strong>${escapeHtml(entryItem(entry))}</strong>
          <span>${escapeHtml(entry.group)}${entry.detail ? ` | ${escapeHtml(entry.detail)}` : ""}</span>
          <small>${escapeHtml(detail)} | ${new Date(entry.ts).toLocaleTimeString()}</small>
        </div>
        <div class="student-row-actions">
          <button class="icon-button" type="button" data-note="${escapeHtml(entry.id)}" aria-label="Add note">&#9998;</button>
          <button class="delete-entry" type="button" data-delete="${escapeHtml(entry.id)}" aria-label="Delete entry">x</button>
        </div>
      </article>
    `;
  }).join("");
}

function openNoteModal(id) {
  const entry = state.entries.find((candidate) => candidate.id === id);
  if (!entry) return;
  state.noteEntryId = id;
  ui.noteText.value = entry.detail || "";
  ui.noteModal.hidden = false;
}

function saveNote() {
  const entry = state.entries.find((candidate) => candidate.id === state.noteEntryId);
  if (entry) {
    entry.detail = ui.noteText.value.trim();
    saveEntries();
    renderAll();
  }
  ui.noteModal.hidden = true;
  state.noteEntryId = null;
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function buildCsv(entries) {
  const header = ["Date", "Time", "ISO", "Item", "Group", "Student", "Semester", "Chapter", "Detail"];
  const rows = entries.map((entry) => {
    const date = new Date(entry.ts);
    return [
      localDateKey(date),
      date.toLocaleTimeString(),
      entry.ts,
      entryItem(entry),
      entry.group,
      entry.student,
      entry.semester,
      entry.chapter,
      entry.detail
    ].map(csvEscape).join(",");
  });
  return [header.join(","), ...rows].join("\n");
}

function buildJson(entries) {
  return JSON.stringify(entries.map(normalizeEntry).filter(Boolean), null, 2);
}

function exportFilename() {
  const suffix = state.filter.toLowerCase();
  const ext = state.exportFormat === "CSV" ? "csv" : "json";
  return `res-scholar-tracker-${suffix}-${localDateKey()}.${ext}`;
}

function renderExport() {
  const entries = visibleEntries();
  ui.exportText.value = state.exportFormat === "CSV" ? buildCsv(entries) : buildJson(entries);
  ui.formatCsv.classList.toggle("on", state.exportFormat === "CSV");
  ui.formatJson.classList.toggle("on", state.exportFormat === "JSON");
}

function openExport() {
  renderExport();
  ui.exportModal.hidden = false;
}

function nativeBridge() {
  return typeof AndroidBridge !== "undefined" ? AndroidBridge : null;
}

function textToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function downloadText(text, filename, mimeType) {
  const bridge = nativeBridge();
  if (bridge) {
    const ok = bridge.saveExport(textToBase64(text), filename, mimeType);
    if (!ok) showToast("Save failed", false);
    return;
  }

  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadExport() {
  downloadText(ui.exportText.value, exportFilename(), state.exportFormat === "CSV" ? "text/csv" : "application/json");
}

async function copyExport() {
  await navigator.clipboard.writeText(ui.exportText.value);
  showToast("Export copied", false);
}

async function shareText(text, title) {
  const bridge = nativeBridge();
  if (bridge) {
    const ok = bridge.shareText(text, title);
    if (!ok) showToast("Share failed", false);
    return;
  }

  if (navigator.share) {
    await navigator.share({ title, text });
  } else {
    location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text)}`;
  }
}

function shareExport() {
  return shareText(ui.exportText.value, "RES Scholar Tracker export");
}

function csvRecords(text) {
  const rows = text.trim().split(/\r?\n/).map((line) => {
    const cells = [];
    let cell = "";
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"' && line[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === "," && !quoted) {
        cells.push(cell);
        cell = "";
      } else {
        cell += char;
      }
    }
    cells.push(cell);
    return cells;
  });
  const headers = rows.shift().map((header) => header.trim());
  return rows.map((cells) => Object.fromEntries(headers.map((header, index) => [header, (cells[index] || "").trim()])));
}

function parseCsv(text) {
  return csvRecords(text).map((record) => normalizeEntry({
    id: record.id,
    item: record.Item || record.Exercise,
    group: record.Group,
    ts: record.ISO,
    student: record.Student,
    semester: record.Semester,
    chapter: record.Chapter,
    detail: record.Detail
  })).filter(Boolean);
}

function buildStudentsCsv() {
  const header = ["Name", "Email", "EnrollmentDate", "Semester", "Topic", "EnrolmentNo", "ChapterScheme", "Notes"];
  const rows = state.students.map((student) => [
    student.name,
    student.email || "",
    student.enrollmentDate,
    student.semester,
    student.topic,
    student.enrolmentNo,
    student.chapterScheme || "",
    student.notes
  ].map(csvEscape).join(","));
  return [header.join(","), ...rows].join("\n");
}

function parseStudentsCsv(text) {
  return csvRecords(text)
    .map((record) => ({
      name: (record.Name || "").trim(),
      email: (record.Email || "").trim(),
      enrollmentDate: record.EnrollmentDate || "",
      semester: record.Semester ? Number(record.Semester) : "",
      topic: record.Topic || "",
      enrolmentNo: record.EnrolmentNo || "",
      chapterScheme: record.ChapterScheme || "",
      notes: record.Notes || ""
    }))
    .filter((record) => record.name);
}

function exportStudents() {
  downloadText(buildStudentsCsv(), `res-scholar-students-${localDateKey()}.csv`, "text/csv");
}

function importStudents(imported, options = {}) {
  let added = 0;
  let updated = 0;
  imported.forEach((record) => {
    const key = record.name.toLowerCase();
    const existing = state.students.find((student) => student.name.toLowerCase() === key);
    if (existing) {
      Object.assign(existing, record);
      updated += 1;
    } else {
      state.students.push({ id: entryId(), ...record });
      added += 1;
    }
  });
  saveStudents();
  renderStudentsList();
  renderStudentDropdown();
  renderAll();
  if (!options.silent) showToast(`${added} added, ${updated} updated`, false);
}

async function handleStudentsImport(file) {
  if (!file) return;
  const text = await file.text();
  importStudents(parseStudentsCsv(text));
  ui.studentsImportFile.value = "";
}

function buildDocumentsCsv() {
  const header = ["Student", "Subject", "DocType", "Version", "Filename", "SizeKB", "Date"];
  const rows = state.documents.map((document_) => [
    document_.student,
    document_.subject,
    document_.docType,
    document_.version,
    document_.filename,
    document_.sizeKb,
    document_.date
  ].map(csvEscape).join(","));
  return [header.join(","), ...rows].join("\n");
}

function parseDocumentsCsv(text) {
  return csvRecords(text)
    .map((record) => ({
      student: (record.Student || "").trim(),
      subject: record.Subject || "",
      docType: record.DocType || "",
      version: record.Version || "",
      filename: record.Filename || "",
      sizeKb: record.SizeKB ? Number(record.SizeKB) : "",
      date: record.Date || ""
    }))
    .filter((record) => record.student);
}

function exportDocuments() {
  downloadText(buildDocumentsCsv(), `res-scholar-documents-${localDateKey()}.csv`, "text/csv");
}

function importDocuments(imported, options = {}) {
  let added = 0;
  imported.forEach((record) => {
    state.documents.push({ id: entryId(), ...record });
    added += 1;
  });
  saveDocuments();
  renderDocumentsList();
  renderAll();
  if (!options.silent) showToast(`${added} document(s) imported`, false);
}

async function handleDocumentsImport(file) {
  if (!file) return;
  const text = await file.text();
  importDocuments(parseDocumentsCsv(text));
  ui.documentsImportFile.value = "";
}

function buildPublicationsCsv() {
  const header = ["Student", "Title", "CoAuthors", "TargetJournal", "Stage", "LastUpdate"];
  const rows = state.publications.map((publication) => [
    publication.student,
    publication.title,
    publication.coAuthors,
    publication.targetJournal,
    publication.stage,
    publication.lastUpdate
  ].map(csvEscape).join(","));
  return [header.join(","), ...rows].join("\n");
}

function parsePublicationsCsv(text) {
  return csvRecords(text)
    .map((record) => ({
      student: (record.Student || "").trim(),
      title: record.Title || "",
      coAuthors: record.CoAuthors || "",
      targetJournal: record.TargetJournal || "",
      stage: record.Stage || "Drafting",
      lastUpdate: record.LastUpdate || ""
    }))
    .filter((record) => record.student && record.title);
}

function exportPublications() {
  downloadText(buildPublicationsCsv(), `res-scholar-publications-${localDateKey()}.csv`, "text/csv");
}

function importPublications(imported, options = {}) {
  let added = 0;
  imported.forEach((record) => {
    state.publications.push({ id: entryId(), ...record });
    added += 1;
  });
  savePublications();
  renderPublicationsList();
  renderAll();
  if (!options.silent) showToast(`${added} publication(s) imported`, false);
}

async function handlePublicationsImport(file) {
  if (!file) return;
  const text = await file.text();
  importPublications(parsePublicationsCsv(text));
  ui.publicationsImportFile.value = "";
}

function importEntries(imported) {
  const existingIds = new Set(state.entries.map((entry) => entry.id));
  const existingFingerprint = new Set(state.entries.map((entry) => `${entry.ts}|${entryItem(entry)}|${entry.group}`));
  const fresh = imported.filter((entry) => {
    const fingerprint = `${entry.ts}|${entryItem(entry)}|${entry.group}`;
    return !existingIds.has(entry.id) && !existingFingerprint.has(fingerprint);
  });
  state.entries = [...state.entries, ...fresh];
  saveEntries();
  renderAll();
  showToast(`${fresh.length} imported`, false);
}

async function handleImport(file) {
  if (!file) return;
  const text = await file.text();
  const imported = file.name.toLowerCase().endsWith(".json")
    ? JSON.parse(text).map(normalizeEntry).filter(Boolean)
    : parseCsv(text);
  importEntries(imported);
  ui.importFile.value = "";
}

function tickClock() {
  const now = new Date();
  ui.clock.textContent = `${now.toLocaleDateString()} | ${now.toLocaleTimeString()}`;
}

function renderAll() {
  saveContext();
  renderGroups();
  renderItems();
  renderMessageRecipient();
  renderSummary();
  renderInsights();
  renderRegisterSnapshots();
  renderHistory();
  if (!ui.exportModal.hidden) renderExport();
}

function bindEvents() {
  ui.groupSelector.addEventListener("click", (event) => {
    const button = event.target.closest("[data-group]");
    if (!button) return;
    state.activeGroup = button.dataset.group;
    renderAll();
  });

  ui.itemSelector.addEventListener("click", (event) => {
    const button = event.target.closest("[data-item]");
    if (!button) return;
    handleItemAction(button.dataset.item);
  });

  ui.history.addEventListener("click", (event) => {
    const noteButton = event.target.closest("[data-note]");
    if (noteButton) { openNoteModal(noteButton.dataset.note); return; }
    const button = event.target.closest("[data-delete]");
    if (!button) return;
    deleteEntry(button.dataset.delete);
  });

  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach((chip) => chip.classList.remove("on"));
      button.classList.add("on");
      renderAll();
    });
  });

  ui.studentName.addEventListener("change", () => {
    const student = state.students.find((candidate) => candidate.name === ui.studentName.value);
    if (student && student.semester) ui.semesterNumber.value = student.semester;
    renderMessageRecipient();
  });

  [ui.studentName, ui.semesterNumber, ui.chapterNumber].forEach((control) => {
    control.addEventListener("input", renderAll);
    control.addEventListener("change", renderAll);
  });

  ui.openExport.addEventListener("click", openExport);
  ui.closeExport.addEventListener("click", () => { ui.exportModal.hidden = true; });
  ui.formatCsv.addEventListener("click", () => { state.exportFormat = "CSV"; renderExport(); });
  ui.formatJson.addEventListener("click", () => { state.exportFormat = "JSON"; renderExport(); });
  ui.copyExport.addEventListener("click", () => copyExport().catch(() => showToast("Copy failed", false)));
  ui.downloadExport.addEventListener("click", downloadExport);
  ui.shareExport.addEventListener("click", () => shareExport().catch(() => {}));
  ui.importFile.addEventListener("change", () => handleImport(ui.importFile.files[0]).catch(() => showToast("Import failed", false)));
  ui.undoLast.addEventListener("click", undoLast);

  ui.meetingPunch.addEventListener("click", toggleMeetingPunch);

  ui.openMessage.addEventListener("click", openMessageModal);
  ui.closeMessage.addEventListener("click", () => { ui.messageModal.hidden = true; });
  ui.messagePresets.addEventListener("click", (event) => {
    const button = event.target.closest("[data-template]");
    if (!button) return;
    sendPreset(Number(button.dataset.template));
  });
  ui.snapshotRetrieval.addEventListener("click", (event) => {
    const button = event.target.closest("[data-template]");
    if (!button) return;
    sendPreset(Number(button.dataset.template));
  });

  ui.openStudents.addEventListener("click", openStudentsModal);
  ui.closeStudents.addEventListener("click", () => { ui.studentsModal.hidden = true; });
  ui.studentFormSave.addEventListener("click", saveStudentForm);
  ui.studentsList.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-student]");
    if (editButton) { editStudent(editButton.dataset.editStudent); return; }
    const removeButton = event.target.closest("[data-remove-student]");
    if (removeButton) removeStudent(removeButton.dataset.removeStudent);
  });
  ui.studentsExport.addEventListener("click", exportStudents);
  ui.studentsImportFile.addEventListener("change", () => handleStudentsImport(ui.studentsImportFile.files[0]).catch(() => showToast("Import failed", false)));

  ui.openDocuments.addEventListener("click", openDocumentsModal);
  ui.closeDocuments.addEventListener("click", () => { ui.documentsModal.hidden = true; });
  ui.documentFormSave.addEventListener("click", saveDocumentForm);
  ui.documentsList.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-document]");
    if (editButton) { editDocument(editButton.dataset.editDocument); return; }
    const removeButton = event.target.closest("[data-remove-document]");
    if (removeButton) removeDocument(removeButton.dataset.removeDocument);
  });
  ui.documentsExport.addEventListener("click", exportDocuments);
  ui.documentsImportFile.addEventListener("change", () => handleDocumentsImport(ui.documentsImportFile.files[0]).catch(() => showToast("Import failed", false)));

  ui.openPublications.addEventListener("click", openPublicationsModal);
  ui.closePublications.addEventListener("click", () => { ui.publicationsModal.hidden = true; });
  ui.publicationFormSave.addEventListener("click", savePublicationForm);
  ui.publicationsList.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-publication]");
    if (editButton) { editPublication(editButton.dataset.editPublication); return; }
    const removeButton = event.target.closest("[data-remove-publication]");
    if (removeButton) removePublication(removeButton.dataset.removePublication);
  });
  ui.publicationsExport.addEventListener("click", exportPublications);
  ui.publicationsImportFile.addEventListener("change", () => handlePublicationsImport(ui.publicationsImportFile.files[0]).catch(() => showToast("Import failed", false)));

  ui.closeNote.addEventListener("click", () => { ui.noteModal.hidden = true; state.noteEntryId = null; });
  ui.saveNote.addEventListener("click", saveNote);

  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "r") {
      event.preventDefault();
      refreshStudentSeed().catch(() => showToast("Student refresh failed", false));
    }
  });
}

function boot() {
  loadStudents();
  loadDocuments();
  loadPublications();
  loadState();
  renderStudentDropdown();
  applyContext();
  bindEvents();
  loadTemplates();
  syncStudentsSeed();
  syncDocumentsSeed();
  syncPublicationsSeed();
  tickClock();
  setInterval(tickClock, 1000);
  renderAll();
}

boot();
