var cluster = require('cluster');

function startWorker(cpu) {
    var worker = cluster.fork();
    console.log('CLUSTER: Worker %d started on CPU %s - %d', worker.id, cpu.model, cpu.speed);
}

if (cluster.isMaster) {
    require('os').cpus().forEach(function (cpu) {
        startWorker(cpu);
    });

    // log disconnected workers
    cluster.on('disconnect', function (worker) {
        console.log('CLUSTER: Worker %d disconnected from the cluster', worker.id);
    });

    // replace dead workers with new ones
    cluster.on('exit', function (worker, code, signal) {
        console.log('CLUSTER: Worker %d is dead - Exit code %d (%s)', worker.id, code, signal);
    });
} else {
    // start app
    require('./tiles.js')();
}