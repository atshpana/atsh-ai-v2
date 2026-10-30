/**
 * Background worker entry point.
 * Queue transport is intentionally not connected until workload requirements
 * justify Redis/BullMQ and the owner approves the hosting choice.
 */
async function main() {
  process.stdout.write("ATSH AI worker boundary is initialized; no jobs are registered.\n");
}
void main();
