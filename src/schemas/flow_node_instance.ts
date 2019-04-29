import {AllowNull, Column, CreatedAt, DataType, HasMany, Model, Table, Unique, UpdatedAt} from 'sequelize-typescript';

import {FlowNodeInstanceState} from '@process-engine/flow_node_instance.contracts';

import {ProcessTokenModel} from './process_token';

@Table({modelName: 'FlowNodeInstance', tableName: 'FlowNodeInstance', version: true})
export class FlowNodeInstanceModel extends Model<FlowNodeInstanceModel> {

  @Column
  @AllowNull(false)
  @Unique
  public flowNodeInstanceId: string;

  @Column
  @AllowNull(false)
  public flowNodeId: string;

  @Column
  @AllowNull(true)
  public flowNodeType: string;

  @Column
  @AllowNull(true)
  public eventType: string;

  @Column
  @AllowNull(true)
  public correlationId: string;

  @Column
  @AllowNull(true)
  public processModelId: string;

  @Column
  @AllowNull(true)
  public processInstanceId: string;

  @Column
  @AllowNull(true)
  public parentProcessInstanceId: string;

  @Column(DataType.TEXT)
  @AllowNull(true)
  public identity: string;

  @Column({type: DataType.TEXT, defaultValue: 'finished'})
  @AllowNull(true)
  public state: FlowNodeInstanceState;

  @Column(DataType.TEXT)
  @AllowNull(true)
  public error: string;

  @Column
  @AllowNull(true)
  public previousFlowNodeInstanceId: string;

  @HasMany(() => ProcessTokenModel)
  public processTokens: Array<ProcessTokenModel>;

  @CreatedAt
  public createdAt?: Date;

  @UpdatedAt
  public updatedAt?: Date;
}
