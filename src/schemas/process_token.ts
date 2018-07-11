import * as Sequelize from 'sequelize';

export interface IProcessTokenAttributes {
  id: string;
  processInstanceId: string;
  processModelId: string;
  correlationId: string;
  identity: string; // Contains the stringified IIdentity
  createdAt: Date;
  caller?: string; // Only set, if the process token belongs to a subprocess
  payload: string; // Contains the stringified payload
}

export type ProcessToken = Sequelize.Instance<IProcessTokenAttributes> & IProcessTokenAttributes;

export function defineProcessToken(sequelize: Sequelize.Sequelize): Sequelize.Model<ProcessToken, IProcessTokenAttributes> {
  const attributes: SequelizeAttributes<IProcessTokenAttributes> = {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    processInstanceId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    processModelId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    correlationId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    identity: {
      // Note: Sequelize.STRING equals varchar(255).
      // Depending on the type of token used, this can easily exceed 255 chars.
      type: Sequelize.TEXT,
      allowNull: false,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: sequelize.fn('NOW'),
    },
    caller: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    payload: {
      // NOTE: Use Sequelize.TEXT, since payloads can contain all kinds of things and could therefore exceed 255 chars.
      type: Sequelize.TEXT,
      allowNull: true,
    },
  };

  // TODO: Rename to `ProcessToken`, once the old datamodel with the same name is removed.
  return sequelize.define<ProcessToken, IProcessTokenAttributes>('ProcessTokenNew', attributes);
}
