import * as Sequelize from 'sequelize';
import {ProcessToken} from './process_token';

export interface IFlowNodeInstanceAttributes {
  id: string;
  flowNodeInstanceId: string;
  flowNodeId: string;
  isSuspended: boolean;
  // Contains the association to the ProcessToken model.
  // Must be optional, otherwise this property will be expected in the attribute payload of `sequelize.define`.
  processToken?: ProcessToken;
}

export type FlowNodeInstance = Sequelize.Instance<IFlowNodeInstanceAttributes> & IFlowNodeInstanceAttributes;

export function defineFlowNodeInstance(sequelize: Sequelize.Sequelize): Sequelize.Model<FlowNodeInstance, IFlowNodeInstanceAttributes> {

  const attributes: SequelizeAttributes<IFlowNodeInstanceAttributes> = {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    flowNodeInstanceId: {
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
}
