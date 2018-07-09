import {IFlowNodeInstanceRepository, Runtime} from '@process-engine/process_engine_contracts';

export class FlowNodeInstanceRepository implements IFlowNodeInstanceRepository {

  public async queryByCorrelation(correlationId: string): Promise<Array<Runtime.Types.FlowNodeInstance>> {
    throw new Error('Not implemented.');
  }

  public async queryByProcessModel(processModelId: string): Promise<Array<Runtime.Types.FlowNodeInstance>> {
    throw new Error('Not implemented.');
  }

  public async querySuspendedByCorrelation(correlationId: string): Promise<Array<Runtime.Types.FlowNodeInstance>> {
    throw new Error('Not implemented.');
  }

  public async querySuspendedByProcessModel(processModelId: string): Promise<Array<Runtime.Types.FlowNodeInstance>> {
    throw new Error('Not implemented.');
  }

  public async persistOnEnter(token: Runtime.Types.ProcessToken,
                              flowNodeId: string,
                              flowNodeInstanceId: string): Promise<Runtime.Types.FlowNodeInstance> {

    throw new Error('Not implemented.');
  }

  public async persistOnExit(token: Runtime.Types.ProcessToken,
                             flowNodeId: string,
                             flowNodeInstanceId: string): Promise<Runtime.Types.FlowNodeInstance> {
    throw new Error('Not implemented.');
  }

  public async suspend(token: Runtime.Types.ProcessToken,
                       flowNodeInstanceId: string,
                       correlationHash?: string): Promise<Runtime.Types.FlowNodeInstance> {
    throw new Error('Not implemented.');
  }

  public async resume(flowNodeInstanceId: string): Promise<Runtime.Types.FlowNodeInstance> {
    throw new Error('Not implemented.');
  }
}
