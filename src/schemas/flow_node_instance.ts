import * as Sequelize from 'sequelize';

export interface IFlowNodeInstanceAttributes {
  id: string;
  instanceId: string;
  flowNodeId: string;
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
    isSuspended: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  };

  return sequelize.define<FlowNodeInstance, IFlowNodeInstanceAttributes>('FlowNodeInstance', attributes);

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
  //
  // return flowNodeInstanceModel;

}
