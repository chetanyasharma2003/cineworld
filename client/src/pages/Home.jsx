import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Row from "../components/Row";
import Banner from "../components/Banner";
import { api, getErrorMessage } from "../lib/api";

function Home() {
  const [sections, setSections] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/movies/home");
        setSections(res.data.sections);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load movies."));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-[#0a0a0a] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center font-black text-white text-xl">C</div>
            <span className="text-2xl font-black">Cine<span className="text-red-500">World</span></span>
          </div>
          <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-red-600 rounded-full animate-pulse" style={{ width: "60%" }} />
          </div>
          <p className="text-gray-500 text-sm">Loading your movies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#0a0a0a] min-h-screen flex items-center justify-center px-6 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen">
      <Navbar />
      <Banner movies={sections.popular} />

      <div className="relative z-10 -mt-16 space-y-6 pb-16">
        <Row title="Now Playing" movies={sections.nowPlaying} />
        <Row title="Trending & Popular" movies={sections.popular} />
        <Row title="Top Rated All Time" movies={sections.topRated} />
        <Row title="Upcoming Releases" movies={sections.upcoming} large />
        <Row title="Action & Adventure" movies={sections.action} />
        <Row title="Comedy" movies={sections.comedy} />
        <Row title="Horror" movies={sections.horror} />
        <Row title="Science Fiction" movies={sections.scifi} />
        <Row title="Thrillers" movies={sections.thriller} />
        <Row title="Romance" movies={sections.romance} />
        <Row title="Animation" movies={sections.animation} />
        <Row title="Bollywood" movies={sections.bollywood} />
      </div>

      <footer className="border-t border-white/5 px-8 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-7 h-7 bg-red-600 rounded-md flex items-center justify-center font-black text-white text-sm">C</div>
          <span className="font-black">Cine<span className="text-red-500">World</span></span>
        </div>
        <p className="text-xs text-gray-600">Movie data powered by TMDB.</p>
        <p className="text-xs text-gray-700 mt-1">Built for learning purposes only.</p>
      </footer>
    </div>
  );
}

export default Home;
