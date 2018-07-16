import * as Sequelize from 'sequelize';

import {
  defineFlowNodeInstance,
  defineProcessToken,
  FlowNodeInstance,
  IFlowNodeInstanceAttributes,
  IProcessTokenAttributes,
  ProcessToken,
} from './schemas/index';

export async function loadModels(sequelizeInstance: Sequelize.Sequelize): Promise<void> {

  const flowNodeInstance: Sequelize.Model<FlowNodeInstance, IFlowNodeInstanceAttributes> = defineFlowNodeInstance(sequelizeInstance);
  const processToken: Sequelize.Model<ProcessToken, IProcessTokenAttributes> = defineProcessToken(sequelizeInstance);

  flowNodeInstance.hasOne(processToken, {
    as: 'processToken',
    foreignKey: 'flowNodeInstanceId',
  });

  await sequelizeInstance.sync();
}
