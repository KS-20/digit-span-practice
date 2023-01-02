#!/usr/bin/env node

import {strict as nodeAssert} from 'node:assert/strict';
import path from  "path";
import 'dotenv/config';
var pathToWebDriver = process.env['FIREFOX_DRIVER_DIR'];
process.env['PATH'] = process.env['PATH']+ path.delimiter+pathToWebDriver;

import {Builder, By, Key, until} from 'selenium-webdriver';

function assert(actual,expected){
  nodeAssert.strictEqual(actual,expected)
}

async function testList() {
  let driver = await new Builder().forBrowser('firefox').build();
  try {
    await driver.get("http://localhost:3000/");
    await basicTest(driver);
    await customServerTest(driver);
    console.log("Finished");
  } finally {
    await driver.quit();
  }
};

async function basicTest(driver) {
  var numLengthElem = driver.findElement(By.name("input_NumLen"));
  await numLengthElem.clear();
  await numLengthElem.sendKeys("2");

  var repCountElem = driver.findElement(By.name("input_RepCount"));
  await repCountElem.clear();
  await repCountElem.sendKeys("1");

  await driver.findElement(By.id("saveSettings")).click();

  await driver.findElement(By.id("startPractice")).click()

  await driver.wait(until.elementLocated(By.id('numConsole')), 10 * 1000)
  var textToRemember = await driver.findElement(By.id('numConsole')).getText();

  await driver.wait(until.elementLocated(By.name('input_Digits')), 10 * 1000)

  var digitInputElem = driver.findElement(By.name("input_Digits"));
  await digitInputElem.sendKeys(textToRemember)
  await digitInputElem.sendKeys(Key.ENTER)
  assert(await driver.switchTo().alert().getText()  , "Good job! you put the correct answer: "+textToRemember);
  await driver.switchTo().alert().accept();

  var finalMessage = await driver.findElement(By.id('numConsole')).getText();
  assert("succeeded in 1 out of 1" , finalMessage);
}

async function customServerTest(driver){
  await driver.findElement(By.id("dataStorageSelector")).click()
  {
    const dropdown = await driver.findElement(By.id("dataStorageSelector"))
    await dropdown.findElement(By.xpath("//option[. = 'Digit Span Practice Server']")).click()
  }

  await driver.findElement(By.id("signIn")).click();
  var userNameElem = driver.findElement(By.name("input_userNameForLogin"));
  const USER_NAME_FOR_TEST = process.env.USER_NAME_FOR_TEST
  await userNameElem.sendKeys(USER_NAME_FOR_TEST);

  var passwordElem = driver.findElement(By.name("input_passwordForLogin"));
  const USER_FOR_TEST_PASSWORD  = process.env.USER_FOR_TEST_PASSWORD;
  await passwordElem.sendKeys(USER_FOR_TEST_PASSWORD);
  await driver.findElement(By.id("logIn")).click();
  const resultText = await driver.switchTo().alert().getText();
  assert(resultText , "Login Successful");
}

await testList();