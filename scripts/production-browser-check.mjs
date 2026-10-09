import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const origin=process.env.PRODUCTION_TEST_URL;
if(!origin)throw Error('PRODUCTION_TEST_URL is required');
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROME_PATH});
try{
 const page=await browser.newPage();const errors=[],api=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(r.url().includes('/api/'))api.push(r.url());});
 await page.goto(origin);
 await page.getByPlaceholder('Your name').fill('Production Check');
 await page.getByPlaceholder('your.email@company.com').fill('test@example.com');
 await page.getByRole('button',{name:'Sign In',exact:true}).click();
 await page.getByRole('button',{name:'Add performance moment',exact:true}).waitFor();
 assert.ok(api.some(url=>url.startsWith(origin+'/api/health')),JSON.stringify(api));
 assert.ok(api.every(url=>url.startsWith(origin+'/')),JSON.stringify(api));
 await page.getByLabel('Application mode').selectOption('DEMO');
 await page.getByPlaceholder('Your name').fill('Demo Check');
 await page.getByPlaceholder('your.email@company.com').fill('demo@example.com');
 await page.getByRole('button',{name:'Sign In',exact:true}).click();
 await page.getByRole('button',{name:'Prepare me',exact:true}).first().click();
 await page.getByRole('heading',{name:'Your Performance Risk'}).waitFor();
 assert.deepEqual(errors,[]);
 console.log('Production browser passed: login, same-origin API calls, and demo preparation from built static assets.');
}finally{await browser.close();}
