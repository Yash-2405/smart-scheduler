export const toast = ({ title, description }) => {
  alert(`${title}\n${description || ""}`);
};
