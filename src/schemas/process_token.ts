import {AllowNull, BelongsTo, Column, CreatedAt, DataType, ForeignKey, Model, Table, UpdatedAt} from 'sequelize-typescript';

import {ProcessTokenType} from '@process-engine/flow_node_instance.contracts';

import {FlowNodeInstanceModel} from './flow_node_instance';

@Table({modelName: 'ProcessToken', tableName: 'ProcessToken', version: true})
export class ProcessTokenModel extends Model<ProcessTokenModel> {

  @Column({type: DataType.STRING})
  @AllowNull(false)
  public type: ProcessTokenType;

  @Column({type: DataType.TEXT})
  @AllowNull(true)
  public payload: string;

  @ForeignKey(() => FlowNodeInstanceModel)
  @Column
  public flowNodeInstanceId: string;

  @BelongsTo(() => FlowNodeInstanceModel)
  public flowNodeInstance: FlowNodeInstanceModel;

  @CreatedAt
  public createdAt?: Date;

  @UpdatedAt
  public updatedAt?: Date;
}
