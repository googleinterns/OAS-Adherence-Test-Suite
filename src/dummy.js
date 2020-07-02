const {fork} = require('child_process');

const arr = [1, 1203661, 3];
for ( let index = 0; index < 3; index ++) {
  const childProcess = fork('./src/isPrime.js');
  childProcess.send({'number': arr[index]});
  childProcess.on('message', (message) => console.log(message));
}

/*
2367949 (16 ms)
43686389 (200 ms)
93686687 (500 ms)
936868033(4 seconds)
29355126551 (very long time)
*/
