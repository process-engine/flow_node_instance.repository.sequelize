import * as Sequelize from 'sequelize';
import {ProcessToken} from './process_token';

export interface IFlowNodeInstanceAttributes {
  id: string;
  instanceId: string;
  flowNodeId: string;
  processTokenId: string;
  isSuspended: boolean;
}

export type FlowNodeInstance = Sequelize.Instance<IFlowNodeInstanceAttributes> & IFlowNodeInstanceAttributes;

export function defineFlowNodeInstance(sequelize: Sequelize.Sequelize): Sequelize.Model<FlowNodeInstance, IFlowNodeInstanceAttributes> {

  const attributes: SequelizeAttributes<IFlowNodeInstanceAttributes> = {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    instanceId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    flowNodeId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    processTokenId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    isSuspended: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  };

  // const flowNodeInstanceModel: Sequelize.Model<FlowNodeInstance, IFlowNodeInstanceAttributes>
  //   = sequelize.define<FlowNodeInstance, IFlowNodeInstanceAttributes>(
  //     'FlowNodeInstance',
  //     attributes,
  //     {
  //       classMethods: {
  //         associate: (models: Sequelize.Models): void => {
  //           flowNodeInstanceModel.hasOne(models.ProcessToken, {
  //             as: 'processToken',
  //             foreignKey: 'flowNodeInstanceId',
  //           });
  //         },
  //       },
  //     },
  //   );

  return sequelize.define<FlowNodeInstance, IFlowNodeInstanceAttributes>('FlowNodeInstance', attributes);
}
