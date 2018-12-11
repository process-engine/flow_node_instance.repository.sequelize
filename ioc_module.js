'use strict';

const FlowNodeInstanceRepository = require('./dist/commonjs/index').FlowNodeInstanceRepository;
const disposableDiscoveryTag = require('@essential-projects/bootstrapper_contracts').disposableDiscoveryTag;

function registerInContainer(container) {

  container.register('FlowNodeInstanceRepository', FlowNodeInstanceRepository)
    .dependencies('SequelizeConnectionManager')
    .configure('process_engine:flow_node_instance_repository')
    .tags(disposableDiscoveryTag)
    .singleton();
}

module.exports.registerInContainer = registerInContainer;
