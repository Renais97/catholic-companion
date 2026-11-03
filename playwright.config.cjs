const {defineConfig,devices}=require('@playwright/test');
module.exports=defineConfig({
 testDir:'./tests',
 testMatch:'**/*.spec.cjs',
 timeout:30000,
 expect:{timeout:10000},
 retries:process.env.CI?1:0,
 workers:process.env.CI?2:undefined,
 reporter:[['list'],['html',{open:'never',outputFolder:'playwright-report'}]],
 use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure',screenshot:'only-on-failure',actionTimeout:10000},
 projects:[
  {name:'chromium-mobile',use:{...devices['Pixel 7'],browserName:'chromium',timezoneId:'Asia/Singapore'}},
  {name:'webkit-iphone',use:{...devices['iPhone 13'],browserName:'webkit',timezoneId:'Asia/Singapore'}}
 ],
 webServer:{command:'python3 -m http.server 4173 --bind 127.0.0.1',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI,timeout:30000}
});
