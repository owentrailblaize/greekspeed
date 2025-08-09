import { Alumni } from "./mockAlumni";

export function exportAlumniToCSV(alumni: Alumni[], filename: string = "alumni-export.csv") {
  // Define the CSV headers
  const headers = [
    "Full Name",
    "Job Title", 
    "Company",
    "Industry",
    "Chapter",
    "Graduation Year",
    "Email",
    "Phone",
    "Location",
    "Mutual Connections",
    "Last Contact",
    "Verified",
    "Actively Hiring"
  ];

  // Convert alumni data to CSV rows
  const csvRows = alumni.map(alumni => [
    alumni.fullName || "",
    alumni.jobTitle || "",
    alumni.company || "",
    alumni.industry || "",
    alumni.chapter || "",
    alumni.graduationYear || "",
    alumni.email || "",
    alumni.phone || "",
    alumni.location || "",
    alumni.mutualConnectionsCount || alumni.mutualConnections?.length || 0,
    alumni.lastContact ? new Date(alumni.lastContact).toLocaleDateString() : "Never",
    alumni.verified ? "Yes" : "No",
    alumni.isActivelyHiring ? "Yes" : "No"
  ]);

  // Combine headers and data
  const csvContent = [headers, ...csvRows]
    .map(row => 
      row.map(field => {
        // Escape quotes and wrap in quotes if contains comma, newline, or quote
        const escaped = String(field).replace(/"/g, '""');
        if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
          return `"${escaped}"`;
        }
        return escaped;
      }).join(',')
    )
    .join('\n');

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function exportSelectedAlumniToCSV(alumni: Alumni[], selectedIds: string[], filename: string = "selected-alumni.csv") {
  const selectedAlumni = alumni.filter(alumni => selectedIds.includes(alumni.id));
  exportAlumniToCSV(selectedAlumni, filename);
} 