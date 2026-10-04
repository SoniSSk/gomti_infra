/*
 * Accounts module: one BusinessOperation per record. Field names
 * follow the BusinessOperation spec (snake_case, nested groups);
 * `sno` and `update_history` are added for routing and audit like Lab.
 */

/* =========================
   ENUMS
========================= */

/*
 * Account books: each is its own module and Mongo collection, with
 * the same form and rules but its own list of accounts.
 */

export interface AccountGroup {
  /** optgroup heading; omit for a flat list. */
  label?: string;
  accounts: readonly string[];
}

export interface AccountBook {
  key: string;
  title: string;
  /** Mongo collection the book's entries live in. */
  collection: string;
  /** Page URL; also the module nav / dashboard card link. */
  path: string;
  /** Prefix for tracking.id, e.g. "ACC" -> "ACC-1759...". */
  idPrefix: string;
  accountGroups: readonly AccountGroup[];
}

/* GIMPL's accounts; the Company book uses the same list. */
const GIMPL_ACCOUNT_GROUPS = [
  {
    accounts: [
      "SBI Lucknow Head Office",
      "HDFC Gwalior Branch",
      "Bajaj Loan",
      "HDFC Credit Card",
      "Cash",
    ],
  },
] as const satisfies readonly AccountGroup[];

export const ACCOUNT_BOOKS = {
  gimpl: {
    key: "gimpl",
    title: "GIMPL Accounts",
    collection: "accounts",
    path: "/accounts",
    idPrefix: "ACC",
    accountGroups: GIMPL_ACCOUNT_GROUPS,
  },
  company: {
    key: "company",
    title: "Company Accounts",
    collection: "accounts_company",
    path: "/company-accounts",
    idPrefix: "CMP",
    accountGroups: GIMPL_ACCOUNT_GROUPS,
  },
  arvind: {
    key: "arvind",
    title: "Arvind Accounts",
    collection: "accounts_arvind",
    path: "/arvind-accounts",
    idPrefix: "ARV",
    accountGroups: [
      { accounts: ["SBI", "SBI Credit Card", "Cash"] },
    ],
  },
  kuldeep: {
    key: "kuldeep",
    title: "Kuldeep Accounts",
    collection: "accounts_kuldeep",
    path: "/kuldeep-accounts",
    idPrefix: "KUL",
    accountGroups: [
      {
        label: "Credit Cards",
        accounts: [
          "ICICI Amazon Card",
          "ICICI RuPay",
          "Kotak Bank",
          "SBI Credit Card",
          "Axis Flipkart",
          "Axis My Zone",
          "Yes Bank RuPay",
          "Yes Bank Loan",
          "HDFC MoneyBack",
          "HDFC Swiggy",
          "HDFC RuPay (148000)",
          "Papa HDFC Credit Card",
          "Scarpia",
          "Scarpia RuPay",
        ],
      },
      {
        label: "Bank Accounts",
        accounts: [
          "HDFC",
          "ICICI",
          "SBI",
          "Kotak",
          "IDBI",
          "BOI",
          "Airtel",
          "IDBI Prabha",
          "HDFC Papa",
          "Cash",
        ],
      },
    ],
  },
} as const satisfies Record<string, AccountBook>;

export type AccountBookKey = keyof typeof ACCOUNT_BOOKS;

/** The book for a URL / query value, or null if there's no such book. */
export const getAccountBook = (key?: string | null): AccountBook | null =>
  key && Object.hasOwn(ACCOUNT_BOOKS, key)
    ? ACCOUNT_BOOKS[key as AccountBookKey]
    : null;

/** Every account in the book, across groups. */
export const getBookAccounts = (book: AccountBook): string[] =>
  book.accountGroups.flatMap(({ accounts }) => accounts);

export type AccountName = string;

/** Category -> its operation types. */
export const OPERATION_TYPES = {
  Payment: [
    "Bill Payment",
    "Advance Payment",
    "Advance Received",
    "Payment Received",
    "Refund",
    "Partial Payment",
    "Adjustment",
    "Other",
  ],
  Transactions: ["Sales", "Purchase / Bills", "Sales Order", "Other"],
  Masters: [
    "Vendor Add",
    "Vendor Delete",
    "Customer Add",
    "Customer Delete",
    "Item Add",
    "Item Delete",
  ],
  Compliance: ["TDS", "GST", "EPF", "ESI"],
  Reports: ["Reports"],
  Other: ["Other"],
} as const satisfies Record<string, readonly string[]>;

export type OperationCategory = keyof typeof OPERATION_TYPES;

export const OPERATION_CATEGORIES = Object.keys(
  OPERATION_TYPES,
) as OperationCategory[];

export const OPERATION_STATUSES = [
  "Pending",
  "Zoho Entry Done",
  "On Hold",
  "Under Review",
  "In Progress",
  "Partially Completed",
  "Correction Required",
  "Rejected",
  "Cancelled",
  "Completed",
  "Awaiting Approval",
  "Awaiting Documents",
  "Duplicate",
  "Not Applicable",
] as const;

export type OperationStatus = (typeof OPERATION_STATUSES)[number];

/** Statuses that need a reason before they can be saved. */
export const STATUS_REASON_REQUIRED: ReadonlySet<string> = new Set<OperationStatus>([
  "On Hold",
  "Partially Completed",
  "Correction Required",
  "Rejected",
  "Cancelled",
  "Awaiting Documents",
  "Duplicate",
  "Not Applicable",
]);

export const isReasonRequired = (status?: string | null): boolean =>
  STATUS_REASON_REQUIRED.has(status ?? "");

/** Finished work; everything else stays visible on every date filter. */
export const CLOSED_STATUSES: OperationStatus[] = [
  "Completed",
  "Cancelled",
  "Rejected",
  "Duplicate",
  "Not Applicable",
];

export const DOCUMENT_TYPES = [
  "Invoice",
  "Payment Details",
  "Other",
  "Reports",
  "Statement",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const BRANCHES = ["Lucknow", "Gwalior"] as const;

export type Branch = (typeof BRANCHES)[number];

export const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;

export type Priority = (typeof PRIORITIES)[number];

/** A type of "Other" needs other_reason to say what it is. */
export const isOtherType = (value?: string | null): boolean => value === "Other";

/* =========================
   RECORD
========================= */

export interface OperationTracking {
  id: string;
  reference_no?: string;
  created_date: Date | string;
  created_by: string;
  updated_date?: Date | string;
  updated_by?: string;
  branch?: Branch | "";
  assigned_to?: string;
  priority?: Priority | "";
}

export interface OperationType {
  category: OperationCategory;
  value: string;
  /** Required when value is "Other". */
  other_reason?: string;
}

export interface OperationStatusInfo {
  value: OperationStatus;
  /** Required for statuses in STATUS_REASON_REQUIRED. */
  reason?: string;
}

export interface OperationFile {
  url: string;
  uploaded_by?: string;
  uploaded_date?: Date | string;
}

/** Most files one entry can hold. */
export const MAX_DOCUMENT_FILES = 20;

export interface OperationDocument {
  type?: DocumentType | "";
  document_name?: string;
  document_number?: string;
  document_date?: Date | string;
  files?: OperationFile[];
  remarks?: string;
  /** @deprecated Single-file entries saved before `files`; read via getDocumentFiles(). */
  file_url?: string;
  /** @deprecated See file_url. */
  uploaded_by?: string;
  /** @deprecated See file_url. */
  uploaded_date?: Date | string;
}

/** The entry's files, including a legacy single file_url. */
export const getDocumentFiles = (document?: OperationDocument): OperationFile[] => {
  if (document?.files?.length) return document.files;

  return document?.file_url
    ? [{
      url: document.file_url,
      uploaded_by: document.uploaded_by,
      uploaded_date: document.uploaded_date,
    }]
    : [];
};

export interface OperationFieldUpdate {
  field: string;
  oldValue?: unknown;
  newValue?: unknown;
  updatedBy: string;
  updatedAt: Date | string;
}

export interface BusinessOperation {
  object: "BusinessOperation";
  sno: number;
  name: string;
  description?: string;
  tracking: OperationTracking;
  account: AccountName;
  type: OperationType;
  status: OperationStatusInfo;
  document: OperationDocument;
  update_history: OperationFieldUpdate[];
}

/** What the add / edit form sends; server fills tracking dates and users. */
export interface BusinessOperationInput {
  name: string;
  description?: string;
  account: AccountName;
  type: OperationType;
  status: OperationStatusInfo;
  tracking: Pick<
    OperationTracking,
    "reference_no" | "branch" | "assigned_to" | "priority"
  >;
  document: Omit<
    OperationDocument,
    "files" | "file_url" | "uploaded_by" | "uploaded_date"
  > & {
    /** Uploaded file URLs, in display order. */
    files?: string[];
  };
}

/* =========================
   VALIDATION

   Shared by the form and the API, so both enforce the same rules.
   Returns the first problem, or null when the input is valid.
========================= */

const isOneOf = <T extends string>(list: readonly T[], value: unknown): value is T =>
  typeof value === "string" && (list as readonly string[]).includes(value);

const filled = (value: unknown): boolean =>
  typeof value === "string" && value.trim() !== "";

export const validateOperation = (
  input: Partial<BusinessOperationInput> | null | undefined,
  book: AccountBook,
): string | null => {
  if (!input) return "Missing operation details";

  if (!filled(input.name)) return "Payment for is required";

  if (!isOneOf(getBookAccounts(book), input.account)) {
    return "Select a valid account";
  }

  const category = input.type?.category;
  if (!isOneOf(OPERATION_CATEGORIES, category)) return "Select a valid category";

  if (!isOneOf(OPERATION_TYPES[category], input.type?.value)) {
    return `Select a valid ${category} type`;
  }

  if (isOtherType(input.type?.value) && !filled(input.type?.other_reason)) {
    return "Describe the operation when the category is Other";
  }

  const status = input.status?.value;
  if (!isOneOf(OPERATION_STATUSES, status)) return "Select a valid status";

  if (isReasonRequired(status) && !filled(input.status?.reason)) {
    return `A reason is required for ${status}`;
  }

  const branch = input.tracking?.branch;
  if (branch && !isOneOf(BRANCHES, branch)) return "Select a valid branch";

  const priority = input.tracking?.priority;
  if (priority && !isOneOf(PRIORITIES, priority)) return "Select a valid priority";

  const documentType = input.document?.type;
  if (documentType && !isOneOf(DOCUMENT_TYPES, documentType)) {
    return "Select a valid document type";
  }

  const files = input.document?.files;
  if (files !== undefined) {
    if (!Array.isArray(files) || files.some((url) => !filled(url))) {
      return "Invalid document files";
    }

    if (files.length > MAX_DOCUMENT_FILES) {
      return `At most ${MAX_DOCUMENT_FILES} files per entry`;
    }
  }

  return null;
};
