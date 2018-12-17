import * as moment from 'moment';
import * as Sequelize from 'sequelize';

export interface IProcessTokenAttributes {
  createdAt: Date;
  type: string;
  payload: string;
  flowNodeInstanceId: string;
}

export type ProcessToken = Sequelize.Instance<IProcessTokenAttributes> & IProcessTokenAttributes;

export function defineProcessToken(sequelize: Sequelize.Sequelize): Sequelize.Model<ProcessToken, IProcessTokenAttributes> {
  const attributes: SequelizeAttributes<IProcessTokenAttributes> = {
    createdAt: {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: moment.utc().toDate(),
    },
    type: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    payload: {
      // NOTE: Use Sequelize.TEXT, since payloads can contain all kinds of things and could therefore exceed 255 chars.
      type: Sequelize.TEXT,
      allowNull: true,
    },
    flowNodeInstanceId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  };

  // TODO: Rename to `ProcessToken`, once the old datamodel with the same name is removed.
  return sequelize.define<ProcessToken, IProcessTokenAttributes>('ProcessToken', attributes);
}
