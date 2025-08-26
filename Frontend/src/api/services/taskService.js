import axios from "axios";

const update = async (id, data) => {
  return axios.put(`/api/tasks/${id}`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export default { update /* lainnya */ };
