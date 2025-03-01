#!/usr/bin/env node

import { strict as nodeAssert } from 'node:assert/strict';
import path from "path";
import 'dotenv/config';
var pathToWebDriver = process.env['FIREFOX_DRIVER_DIR'];
process.env['PATH'] = process.env['PATH'] + path.delimiter + pathToWebDriver;

import { Builder, By, Key, until } from 'selenium-webdriver';

function assert(actual, expected) {
  nodeAssert.strictEqual(actual, expected)
}

async function testList() {
  let driver = await new Builder().forBrowser('firefox').build();
  try {
    var addressToTest;
    if (process.argv[2]) {
      addressToTest = "https://KS-20.github.io/digit-span-practice"
    } else {
      addressToTest = "http://localhost:3000/";
    }
    await driver.get(addressToTest);
    await customServerTest(driver);
    console.log("Finished");
  } finally {
    await driver.quit();
  }
};

async function basicTest(driver) {
  await driver.wait(until.elementLocated(By.name('input_NumLen')), 10 * 1000)
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
  await driver.wait(until.alertIsPresent());
  assert(await driver.switchTo().alert().getText(), "Good job! you put the correct answer: " + textToRemember);
  await driver.switchTo().alert().accept();

  var finalMessage = await driver.findElement(By.id('numConsole')).getText();
  assert("succeeded in 1 out of 1", finalMessage);
}

async function signUp(driver, USER_NAME_FOR_TEST, USER_FOR_TEST_PASSWORD) {
  await driver.findElement(By.id("signUp")).click();

  var userNameElem = driver.findElement(By.name("input_userNameForSignUp"));
  await userNameElem.sendKeys(USER_NAME_FOR_TEST);

  var passwordElem = driver.findElement(By.name("input_passwordForSignUp"));
  await passwordElem.sendKeys(USER_FOR_TEST_PASSWORD);
  await driver.findElement(By.id("submitSignUp")).click();
  await driver.wait(until.alertIsPresent());
  var alertText = await driver.switchTo().alert().getText();
  assert(alertText, "Created new User");
  await driver.switchTo().alert().accept();
}

async function getPerfString(driver) {
  return await driver.executeScript(() => {
    return JSON.stringify(window.appEngine.getPerformanceRecord())
  })
}

async function customServerTest(driver) {

  await driver.findElement(By.id("dataStorageSelector")).click()
  {
    const dropdown = await driver.findElement(By.id("dataStorageSelector"))
    await dropdown.findElement(By.xpath("//option[. = 'Digit Span Practice Server']")).click()
  }
  const USER_NAME_FOR_TEST = process.env.USER_NAME_FOR_TEST;
  if (!process.env.USER_NAME_FOR_TEST) {
    throw "environment variable USER_NAME_FOR_TEST is not set, exiting"
  }

  const USER_FOR_TEST_PASSWORD = process.env.USER_FOR_TEST_PASSWORD;
  if (!process.env.USER_FOR_TEST_PASSWORD) {
    throw "environment variable USER_FOR_TEST_PASSWORD is not set, exiting"
  }

  await signUp(driver, USER_NAME_FOR_TEST, USER_FOR_TEST_PASSWORD);

  await driver.wait(until.elementLocated(By.id('logOut')), 10 * 1000)
  await driver.findElement(By.id("logOut")).click();

  await driver.findElement(By.id("signIn")).click();
  var userNameElem = driver.findElement(By.name("input_userNameForLogin"));
  await userNameElem.sendKeys(USER_NAME_FOR_TEST);

  var passwordElem = driver.findElement(By.name("input_passwordForLogin"));
  await passwordElem.sendKeys(USER_FOR_TEST_PASSWORD);
  await driver.findElement(By.id("logIn")).click();
  await driver.wait(until.alertIsPresent());
  var alertText = await driver.switchTo().alert().getText();
  assert(alertText, "Login Successful");
  await driver.switchTo().alert().accept();

  await basicTest(driver);
  await checkPerformanceData(driver);
  await driver.navigate().refresh();
  await driver.wait(until.elementLocated(By.id('customServerMsg')), 10 * 1000)
  await checkPerformanceData(driver);

  await driver.wait(until.elementLocated(By.id('accountOptions')), 10 * 1000)
  await driver.findElement(By.id("accountOptions")).click();
  await driver.findElement(By.id("deleteAccount")).click();

  return
}

async function checkPerformanceData(driver) {
  const expectedString = "{\"perfRecordArray\":[{\"setRecordArray\":[\"2\"],\"category\":\"\",\"maxScore\":\"2\",\"minSuccessScore\":\"2\"}]}";
  const performanceDataStr = await getPerfString(driver);
  assert(performanceDataStr, expectedString);
}

await testList();