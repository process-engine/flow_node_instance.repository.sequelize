import * as Sequelize from 'sequelize';

interface FlowNodeInstanceAttributes {
  id: string;
  instanceId: string;
  flowNodeId: string;
  token: string;
  isSuspended: boolean;
}

type FlowNodeInstance = Sequelize.Instance<FlowNodeInstanceAttributes> & FlowNodeInstanceAttributes;

export function sequelizeFlowNodeInstance(sequelize: Sequelize.Sequelize): any {
  const attributes: SequelizeAttributes<FlowNodeInstanceAttributes> = {
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
    token: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    isSuspended: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  };

  return sequelize.define<FlowNodeInstance, FlowNodeInstanceAttributes>('FlowNodeInstance', attributes);
}
