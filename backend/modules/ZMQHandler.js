/*eslint no-console: ['error', { allow: ['log', 'error'] }] */
/* global console */

const Time = require('../modules/Time');
const TXprocessor = require('../modules/TXprocessor');
const DB = require('../modules/DB');

// The ZMQ Handler receives callbacks from the forked ZeroZMQ libary and processes the messages accordingly
// This prevents ZeroZMQ library to block the main event loop

// TODO: explain the buffers
// TODO: Make buffers stateless and store receivce count per hash

module.exports = {
  process: msg => {
    if (msg.type === 'consoleLog') {
      console.log(Time.Stamp() + msg);
    } else if (msg.type === 'cmd' && msg.call) {
      switch (msg.call) {
        case 'newTX':
          // Only process if the TX was not already received from another node (hash is unique key)
          DB.insertOne({
            collection: `ZMQNewTX-${msg.settings.netName}`,
            item: { hash: msg.zmqTX.newTX.hash }
          })
            .then(() => {
              const dbResponse = { newTX: msg.zmqTX.newTX, settings: msg.settings };
              TXprocessor.NewTX(dbResponse);
            })
            .catch(err => {});
          break;

        case 'newConf':
          // Only process confirmation if it was not already received from another node (hash is unique key)
          DB.insertOne({
            collection: `ZMQNewConf-${msg.settings.netName}`,
            item: { hash: msg.zmqTX.newConf.hash }
          })
            .then(() => {
              TXprocessor.Confirmation({
                transactions: [msg.zmqTX.newConf],
                inclusionStates: [true],
                settings: msg.settings
              });
            })
            .catch(err => {});
          break;

        case 'newMile':
          // Only process if the Milestone was not already received from another node (hash is unique key)
          DB.insertOne({
            collection: `ZMQNewMile-${msg.settings.netName}`,
            item: msg.zmqTX.newMile
          })
            .then(() => {
              const dbResponse = { newMile: msg.zmqTX.newMile, settings: msg.settings };
              TXprocessor.Milestone(dbResponse);
            })
            .catch(err => {});
          break;
        default:
          console.log(Time.Stamp() + 'ZMQ Handler cannot recognize command from ZMQ fork process');
      }
    }
  }
};
