const {createLogger, format, transports} = require('winston');
const {combine, timestamp, label} = format;

const customLogger = createLogger({
  level: 'debug',
  format: combine(
      label({label: 'ATS v1'}),
      timestamp(),
      format.prettyPrint(),
  ),
  transports: [new transports.Console()],
});
module.exports = customLogger;
