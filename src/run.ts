import { IExecutor } from './Executor';
import ITask from './Task';

export default async function run(executor: IExecutor, queue: AsyncIterable<ITask>, maxThreads = 0) {
    maxThreads = Math.max(0, maxThreads);
    let n = maxThreads;
    // let n = 10;
    let inWork: number[] = [];
    let memory: ITask[] = [];
    let streams = 0;
    let iterator = queue[Symbol.asyncIterator]();
    /* 
        let task = await iterator.next();
    
        for (let i = 0; i < 10; i++) {
            console.log('my', task);
            await executor.executeTask(task.value);
            task = await iterator.next();
        }
        return */

    console.log('В промис пошел');


    let main = new Promise(resolve => {


        function fonctionStreams(x: number) {
            streams += x;
            if (streams == 0) return resolve('done');
        }

        // async function job(task: ITask, callback: Function) {
        //     inWork.push(task.targetId);
        //     //! Удалить
        //     // console.log('старт', task.targetId);

        //     // Версия 1
        //     await executor.executeTask(task);

        //     // Верся 2
        //     /* let make = new Promise((resolve) => {
        //         executor.executeTask(task);
        //     })
        //     await make; */


        //     //! Удалить
        //     // console.log('закончил', task.targetId);
        //     inWork.splice(inWork.indexOf(task.targetId), 1);
        //     callback();
        // }

        async function thunder(task: ITask, callback: Function) {
            // callback = callback || thunder;
            // if (task) {

            if (inWork.indexOf(task.targetId) == -1) {
                inWork.push(task.targetId);
                //! Удалить
                // console.log('старт', task.targetId);

                // Версия 1
                await executor.executeTask(task);

                // Верся 2
                /* let make = new Promise((resolve) => {
                    executor.executeTask(task);
                })
                await make; */


                //! Удалить
                // console.log('закончил', task.targetId);
                inWork.splice(inWork.indexOf(task.targetId), 1);
                callback();
            } else {
                memory.push(task);
                callback();
            }
            // }             else {
            //     if (memory.length) {
            //         for (let i = 0; i < memory.length; i++) {
            //             if (inWork.indexOf(memory[i].targetId) == -1) {
            //                 task = memory[i];
            //                 memory.splice(i, 1);
            //                 break;
            //             }
            //         }
            //         if (task) {
            //             job(task, callback);
            //         } else {
            //             fonctionStreams(-1);
            //             // let task = await iterator.next();
            //             // job(task.value, callback);
            //         }
            //     } else {
            //         fonctionStreams(-1);
            //     }
            // }
        }

        async function getAndThunder() {
            let flag: boolean = false;
            if (memory.length) {
                for (let i = 0; i < memory.length; i++) {
                    if (inWork.indexOf(memory[i].targetId) == -1) {
                        let task = memory[i];
                        memory.splice(i, 1);
                        flag = true;
                        thunder(task, getAndThunder);
                        break;
                    }
                }
                if (!flag) {
                    let task = await iterator.next();
                    thunder(task.value, getAndThunder);
                }
            } else {
                let task = await iterator.next();
                if (task.value) {
                    thunder(task.value, getAndThunder);
                } else {
                    if (inWork.length) {
                        await new Promise((resolve) => {
                            setTimeout(() => {
                                resolve('');
                            }, 100)
                        })
                        getAndThunder();
                        // fonctionStreams(-1);
                    } else {
                        fonctionStreams(-1);
                    }
                }
            }

            // let task = await iterator.next();
            // thunder(task.value, getAndThunder);
        }

        async function mabyThunder() {

            let task = await iterator.next();

            if (task.value) {
                fonctionStreams(1);
                thunder(task.value, mabyThunder);
            }

            // Дополнение
            let flag: boolean = false;
            if (memory.length) {
                for (let i = 0; i < memory.length; i++) {
                    if (inWork.indexOf(memory[i].targetId) == -1) {
                        let task = memory[i];
                        memory.splice(i, 1);
                        flag = true;
                        thunder(task, mabyThunder);
                        break;
                    }
                }
                if (!flag) {
                    fonctionStreams(-1);
                }
            } else {
                fonctionStreams(-1);
            }
        }

        // for (let i = 0; i < 10; i++) {
        //     iterator.next().then(result => {
        //         let task = result;
        //         executor.executeTask(task.value);
        //     });
        // }

        // resolve('');

        if (n > 0) {
            for (let i = 0; i < n; i++) {
                fonctionStreams(1);
                getAndThunder();
            }
        } else {
            mabyThunder();
        }

    })
    await main;

    return;
}
