import {readdirSync} from 'node:fs';
import path from 'node:path';

import {testPortal} from '../../../../src/portal/testPortal';

// Сценарий на тысячи ходов идёт долго.
testPortal.describe.configure({timeout: 30 * 60_000});

const dir = import.meta.dirname;
const files = readdirSync(dir)
  .filter(file => file.endsWith('.json'))
  .sort();

for (const file of files) {
  testPortal(
    `Сценарий шашек: ${path.basename(file, '.json')}`,
    async ({scenarios}) => {
      await scenarios.run(path.join(dir, file));
    },
  );
}
