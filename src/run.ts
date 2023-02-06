import { IExecutor } from './Executor';
import ITask from './Task';

export default async function run(executor: IExecutor, queue: AsyncIterable<ITask>, maxThreads = 0) {

    maxThreads = Math.max(0, maxThreads);
    let inWork: number[] = [];
    let memory: ITask[] = [];
    let streams = 0;
    let iterator = queue[Symbol.asyncIterator]();

    let main = new Promise(resolve => {

        function fonctionStreams(x: number) {
            streams += x;
            if (streams == 0) resolve('done');
        }

        async function thunderOfCount(task: ITask, callback: Function) {
            if (inWork.indexOf(task.targetId) == -1) {
                inWork.push(task.targetId);

                await executor.executeTask(task);

                inWork.splice(inWork.indexOf(task.targetId), 1);
                callback();
            } else {
                memory.push(task);
                callback();
            }
        }

        async function grtTaskQueue() {
            let task = await iterator.next();
            if (!task.done) {
                thunderOfCount(task.value, countThreds);
            } else {
                if (inWork.length) {
                    await new Promise((resolve) => {
                        setTimeout(() => {
                            resolve('');
                        }, 100)
                    })
                    countThreds();
                } else {
                    fonctionStreams(-1);
                }
            }
        }

        async function countThreds() {
            let flag: boolean = false;
            if (memory.length) {
                for (let i = 0; i < memory.length; i++) {
                    if (inWork.indexOf(memory[i].targetId) == -1) {
                        let task = memory[i];
                        memory.splice(i, 1);
                        thunderOfCount(task, countThreds);
                        flag = true;
                        break;
                    }
                }
                if (!flag) {
                    grtTaskQueue();
                }
            } else {
                grtTaskQueue();
            }
        }

        async function thunderMany(task: ITask) {
            if (inWork.indexOf(task.targetId) == -1) {
                inWork.push(task.targetId);

                await executor.executeTask(task);
                
                inWork.splice(inWork.indexOf(task.targetId), 1);
            } else {
                memory.push(task);
            }
            if (memory.length) {
                let flag = false;
                for (let j = 0; j < memory.length; j++) {
                    if (inWork.indexOf(memory[j].targetId) == -1) {
                        task = memory[j];
                        memory.splice(j, 1);
                        flag = true
                        break;
                    }
                }
                if (flag) {
                    thunderMany(task);
                } else {
                    fonctionStreams(-1);
                }
            } else {
                fonctionStreams(-1);
            }
        }

        async function manyThreds() {
            let task = await iterator.next();
            while (!task.done) {
                fonctionStreams(1);
                thunderMany(task.value);
                task = await iterator.next();
            }
        }

        if (maxThreads > 0) {
            for (let i = 0; i < maxThreads; i++) {
                fonctionStreams(1);
                countThreds();
            }
        } else {
            manyThreds();
        }
    });
    await main;

    return;
}
