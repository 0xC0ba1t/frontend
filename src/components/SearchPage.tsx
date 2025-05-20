import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SearchPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Open the dashboard in a new tab
    window.open(
      "https://dashboard.algolia.com/interface-demos/b643a441-2457-42fe-aa56-a5f51a6d1383",
      "_blank"
    );

    // Redirect user back to home (or any fallback route)
    navigate("/");
  }, [navigate]);

  return null;
};

export default SearchPage;
