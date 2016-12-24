# Extremely Fast

`csvtojson` takes care of performance and optimise for Node.js apps. 

[This project](https://github.com/Keyang/csvbench) shows `csvtojson` is about **4 - 6 times** faster than other popular csv parsing libraries.

# Performance Optimisation

Version 1.1.0 is much faster than versions before. 

Below test is parsing a 300k records csv on a 4 core machine

 Time | workerNum = 1 | workerNum = 2 (fork)* | workerNum = 3 |  workerNum = 4
--- | --- | --- | --- | ---
**1.0.3** | 11.806s | 15.945s | 8.611s | 8.314s
**1.1.0** | 9.707s | 10.065s | 5.955s | 4.563s

*when workerNum=2, it only creates 1 extra worker to unblock main process. It is reasonalbe it is slightly slower than workerNum=1 (just use main process).

The result shows V1.1.0 has about 30% - 50% performance boost.

# CPU usage leverage

Below is CPU core usages for v1.1.0 when running the test:

 Core | workerNum = 1 | workerNum = 2| workerNum = 3 |  workerNum = 4
--- | --- | --- | --- | ---
Core 1 (Main) | 100% | 25% | 60% | 90%
Core 2 | N/A | 80% | 70% | 70%
Core 3 | N/A | N/A | 70% | 70%
Core 4 | N/A | N/A | N/A | 70%

