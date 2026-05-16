import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

yargs(hideBin(process.argv))
  .command('sync <configPath>', 'Sync data', (yargs) => {
    return yargs.positional('configPath', {
      describe: 'Path to config file',
      type: 'string',
      demandOption: true
    });
  }, (argv) => {
    console.log(`Syncing with config at ${argv.configPath}`);
  })
  .parse();
