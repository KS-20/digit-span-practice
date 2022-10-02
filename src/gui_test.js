#!/usr/bin/env node

import path from  "path";
import 'dotenv/config';
var pathToWebDriver = process.env['FIREFOX_DRIVER_DIR'];
process.env['PATH'] = process.env['PATH']+ path.delimiter+pathToWebDriver;

import {Builder, By, Key, until} from 'selenium-webdriver';

function assert(result){
  if (!result) {
    throw "a assertion failed!"
  }
}

(async function example() {
  let driver = await new Builder().forBrowser('firefox').build();
  try {
    await driver.get("http://localhost:3000/");

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
    assert(await driver.switchTo().alert().getText() == "Good job! you put the correct answer: "+textToRemember);
    await driver.switchTo().alert().accept();

    var finalMessage = await driver.findElement(By.id('numConsole')).getText();
    assert("succeeded in 1 out of 1" == finalMessage);
    console.log("Finished");
  } finally {
    await driver.quit();
  }
})();
