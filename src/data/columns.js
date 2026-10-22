// columns.js: the ONLY place in the app that knows the CSV's header names.
// If the official file names a column differently, change the text on the right side here and nothing else.

export const COLUMNS = { // "export" lets other files import this; "const" means the name COLUMNS can never be pointed at a different object.
  id: 'Employee Id', // Each person's unique ID, e.g. "E00001". We keep it as text so it's never mangled into a number.
  name: 'Name', // Full name, shown on the card and searched.
  title: 'Job Title', // Job title, shown under the name and also searched.
  department: 'Department', // Drives the coloured department pill and the department filter.
  location: 'Location', // City, e.g. "Toronto, Canada", shown as a pill.
  level: 'Level', // Seniority number from the file: display only. We never use it for maths (we compute depth ourselves).
  managerId: 'Manager Id', // The boss's Employee Id, empty for the CEO. This one column is how the whole tree gets built.
  salary: 'Salary', // Yearly salary. Every cost number in the app is built from this.
} // End of the mapping object.
