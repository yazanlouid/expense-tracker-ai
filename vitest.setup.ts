/*
 * Hard guard on the timezone. If this file does not throw, every test in the
 * suite ran in Europe/London and the BST/GMT assertions are meaningful.
 */
process.env.TZ = "Europe/London";

const januaryOffset = new Date(2025, 0, 15).getTimezoneOffset(); // GMT  => 0
const julyOffset = new Date(2025, 6, 15).getTimezoneOffset(); //    BST  => -60

if (januaryOffset !== 0 || julyOffset !== -60) {
  throw new Error(
    "Tests must run with TZ=Europe/London. " +
      `Resolved zone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}; ` +
      `January offset ${januaryOffset} (expected 0), July offset ${julyOffset} (expected -60). ` +
      "A run in UTC would hide the timezone defects this suite exists to catch.",
  );
}
