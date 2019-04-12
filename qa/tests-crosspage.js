var assert = require('chai').assert;
var webdriver = require('selenium-webdriver');
var By = require('selenium-webdriver').By;
// const firefox = require('selenium-webdriver/firefox');

var driver;

suite('Cross - Page Tests', function () {
    setup(function () {
        driver = new webdriver.Builder().forBrowser('firefox').setFirefoxOptions().build();
    });

    test('requesting rate from inspiration pages shoud populate referrer field', function () {
        var referrer = 'http://localhost:3000/inspirations/virtualroom';

        driver.navigate().to(referrer).then(function (done) {
            driver.findElement(By.id("requestRate"))
                .click().then(function () {
                    assert(driver.findElement(By.id("referrer")).value === referrer);
                    done();
                }).catch(done);
        });
    });

    test('visiting request rate page from anywhere else except inspirations should result in an empty referrer field', function () {
        driver.navigate().to('http://localhost:3000/inspirations/request-rate').then(function (done) {
            assert(driver.findElement(By.id("referrer")).value === '').catch(done);
            done();
        });
    });
});