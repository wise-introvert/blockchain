import axios, { AxiosResponse } from "axios";

// create the network
let promises: Promise<AxiosResponse<any>>[] = [];
[1, 2, 3, 4, 5, 6].map((port: number): void => {
  promises.push(
    axios.post(
      `http://localhost:3000/network/broadcast`,
      { newNodeURL: `http://localhost:300${port}` },
      { headers: { "Content-Type": "application/json" } }
    )
  );
});

Promise.all(promises)
  .then(() => {
    console.log("network registered successfully");
  })
  .catch((error) => {
    console.error(error.message);
  });
