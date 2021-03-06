const model = require('../lib/model');
const variable = require('../lib/variable');
const event = require('../lib/datasets/eventDataset');
let testDatabaseConnection = require('./testLib/testDatabaseConnection');
const assert = require('chai').assert;

let Event = new event(
  new variable('id'),
  new variable('name'),
  new variable('date_start'),
  new variable('number_of_days'),
  new variable('venue_id'),
  new variable('url'),
  new variable('sold_out')
);

const Model = new model(testDatabaseConnection, Event);

describe('model.js', function() {
  afterEach(async function () {
    const sql = 'TRUNCATE TABLE event';
    await testDatabaseConnection.query(sql, function (error) {
      if (error) {
        throw error;
      }
    });
  });

  after(async function () {
    await testDatabaseConnection.end();
  });

  describe('getDatasets()', function() {
    it('should return an Array', async function() {
      assert.instanceOf(await Model.getDatasets(), Array);
    });

    it('should return an Array with one Dataset if event table contains one item', async function() {
      const sql = 'INSERT INTO event SET '
        + 'date_start = "2035-03-03", '
        + 'name = "Darkness-Fest", '
        + 'url = "https://www.ruhrpottmetaller.de"';
      await testDatabaseConnection.query(sql, function (error) {
        if (error) {
          throw error;
        }
      });
      const datasets = await Model.getDatasets();
      assert.instanceOf(datasets, Array);
      assert.equal(datasets.length, 1);
      assert.isObject(datasets[0]);
      assert.instanceOf(datasets[0], event);
      assert.equal(
        datasets[0].getUrl(),
        'https://www.ruhrpottmetaller.de'
      );
      assert.equal(datasets[0].getId(), 1);
      assert.equal(datasets[0].getName(), 'Darkness-Fest');
      assert.equal(datasets[0].getDateStart(), '2035-03-03');
    });

    it('should return an Array with two Datasets if event table contains two items', async function() {
      const sql1 = 'INSERT INTO event SET date_start = CURRENT_DATE() + 1, url = "https://www.beerfest.de"';
      const sql2 = 'INSERT INTO event SET date_start = CURRENT_DATE() + 1, url = "https://www.ruhrpottmetaller.de"';
      await testDatabaseConnection.query(sql1, function (error) {
        if (error) {
          throw error;
        }
      });
      await testDatabaseConnection.query(sql2, function (error) {
        if (error) {
          throw error;
        }
      });
      const datasets = await Model.getDatasets();
      assert.instanceOf(datasets, Array);
      assert.equal(datasets.length, 2);
      assert.equal(
        datasets[0].getUrl(),
        'https://www.beerfest.de'
      );
      assert.equal(
        datasets[1].getUrl(),
        'https://www.ruhrpottmetaller.de'
      );
      assert.equal(
        datasets[1].getId(),
        2
      );
    });

    it('should sort datasets by date', async function() {
      const sql1 = 'INSERT INTO event SET date_start = "2032-07-22", url = "https://www.beerfest.de"';
      const sql2 = 'INSERT INTO event SET date_start = "2032-06-22", url = "https://www.ruhrpottmetaller.de"';
      await testDatabaseConnection.query(sql1, function (error) {
        if (error) {
          throw error;
        }
      });
      await testDatabaseConnection.query(sql2, function (error) {
        if (error) {
          throw error;
        }
      });
      const datasets = await Model.getDatasets();
      assert.equal(
        datasets[1].getUrl(),
        'https://www.beerfest.de'
      );
      assert.equal(
        datasets[0].getUrl(),
        'https://www.ruhrpottmetaller.de'
      );
    });

    it('should ignore datasets in the past', async function() {
      const sql1 = 'INSERT INTO event SET date_start = "2012-07-22", url = "https://www.beerfest.de"';
      const sql2 = 'INSERT INTO event SET date_start = "2032-06-22", url = "https://www.ruhrpottmetaller.de"';
      await testDatabaseConnection.query(sql1, function (error) {
        if (error) {
          throw error;
        }
      });
      await testDatabaseConnection.query(sql2, function (error) {
        if (error) {
          throw error;
        }
      });
      const datasets = await Model.getDatasets();
      assert.equal(
        datasets[0].getUrl(),
        'https://www.ruhrpottmetaller.de'
      );
      assert.equal(datasets.length, 1);
    });
  });
});
