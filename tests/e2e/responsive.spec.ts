import { test, expect } from '@playwright/test';
import { login } from './consolidated-fixture';
test.use({launchOptions:process.env.PLAYWRIGHT_CHROME_PATH?{executablePath:process.env.PLAYWRIGHT_CHROME_PATH}:{},video:'off'});
test('performance plan stays readable on desktop and mobile',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('performance_coach_mode','DEMO'));
 await login(page);await page.getByRole('button',{name:'Prepare me',exact:true}).first().click();
 await expect(page.getByRole('heading',{name:'Your Performance Risk'})).toBeVisible();
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'test-results/plan-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
 await page.screenshot({path:'test-results/plan-mobile.png',fullPage:true});
});
