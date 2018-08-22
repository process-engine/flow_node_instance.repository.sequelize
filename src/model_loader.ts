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

  flowNodeInstance.hasMany(processToken, {
    as: 'processTokens',
    foreignKey: 'flowNodeInstanceProcessTokenForeignKey',
    sourceKey: 'flowNodeInstanceId',
  });

  processToken.belongsTo(flowNodeInstance, {
    foreignKey: 'flowNodeInstanceProcessTokenForeignKey',
    targetKey: 'flowNodeInstanceId',
  });

  await sequelizeInstance.sync();
}
