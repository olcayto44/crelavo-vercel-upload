import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {zipSync,unzipSync} from 'fflate';
import {executeAcceptance} from './acceptance-runner.mjs';
const input=JSON.parse(readFileSync('/job/input.json','utf8'));
const report=await executeAcceptance({...input,workspace:'/data/acceptance',browserType:chromium,zip:zipSync,unzip:unzipSync});
process.stdout.write(JSON.stringify(report));
