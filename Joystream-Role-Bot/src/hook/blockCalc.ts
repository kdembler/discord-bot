export let blockNumber: number = 0;

export function blockCalculation() {
  let block: number = 0;
  const startTime = new Date("2022-12-09T22:42:00");
  block = (blockNumber - startTime.getTime()) / 6000;
  return block;
}

export function upDateBlockNumber(data: number) {
  blockNumber = data;
}
