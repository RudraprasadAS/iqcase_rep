
export const generateCaseNumber = (caseId: string, createdAt: string): string => {
  // Generate a case number using the first 8 characters of the ID and date
  const shortId = caseId.slice(0, 8).toUpperCase();
  const date = new Date(createdAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  return `CASE-${year}${month}-${shortId}`;
};
