import * as Sequelize from 'sequelize';

import {
  defineFlowNodeInstance,
  defineProcessToken,
  FlowNodeInstanceModel,
  IFlowNodeInstanceAttributes,
  IProcessTokenAttributes,
  ProcessTokenModel,
} from './schemas/index';

export async function loadModels(sequelizeInstance: Sequelize.Sequelize): Promise<void> {

  const flowNodeInstance: Sequelize.Model<FlowNodeInstanceModel, IFlowNodeInstanceAttributes> = defineFlowNodeInstance(sequelizeInstance);
  const processToken: Sequelize.Model<ProcessTokenModel, IProcessTokenAttributes> = defineProcessToken(sequelizeInstance);

  flowNodeInstance.hasMany(processToken, {
    as: 'processTokens',
    foreignKey: 'flowNodeInstanceId',
    sourceKey: 'flowNodeInstanceId',
  });

  processToken.belongsTo(flowNodeInstance, {
    foreignKey: 'flowNodeInstanceId',
    targetKey: 'flowNodeInstanceId',
  });

  await sequelizeInstance.sync();
}
