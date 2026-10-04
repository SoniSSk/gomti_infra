import {
  getDocumentFiles,
  isOtherType,
  type BusinessOperationInput,
  type OperationDocument,
} from "@/app/types/accounts";

/*
 * Turns a validated add / edit body into the stored shape: trims text,
 * drops reasons that don't apply, stores dates as Dates, and stamps who
 * uploaded each new file. Run validateOperation() first.
 */

const text = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const toDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;

  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

/* Empty strings and undefined are left out rather than stored. */
const compact = <T extends Record<string, unknown>>(value: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== "" && v !== undefined),
  ) as Partial<T>;

export const buildOperationRecord = (
  input: BusinessOperationInput,
  userName: string,
  now: Date,
  /** The stored document, so an unchanged file keeps its uploader. */
  existingDocument?: OperationDocument,
) => {
  // Files already on the entry keep their uploader; new ones get this user
  const previous = new Map(
    getDocumentFiles(existingDocument).map((file) => [file.url, file]),
  );

  const urls = [...new Set((input.document?.files ?? []).map(text).filter(Boolean))];

  const files = urls.map(
    (url) =>
      previous.get(url) ?? { url, uploaded_by: userName, uploaded_date: now },
  );

  // A legacy file_url is not carried over; its file is in `files` now
  const document = compact({
    type: text(input.document?.type),
    document_name: text(input.document?.document_name),
    document_number: text(input.document?.document_number),
    document_date: toDate(input.document?.document_date),
    files: files.length ? files : undefined,
    remarks: text(input.document?.remarks),
  });

  return {
    name: text(input.name),
    description: text(input.description),
    account: input.account,
    type: compact({
      category: input.type.category,
      value: input.type.value,
      other_reason: isOtherType(input.type.value)
        ? text(input.type.other_reason)
        : "",
    }),
    // Optional on every status; validateOperation() enforces the required ones
    status: compact({
      value: input.status.value,
      reason: text(input.status.reason),
    }),
    tracking: compact({
      reference_no: text(input.tracking?.reference_no),
      branch: text(input.tracking?.branch),
      assigned_to: text(input.tracking?.assigned_to),
      priority: text(input.tracking?.priority),
    }),
    document,
  };
};
