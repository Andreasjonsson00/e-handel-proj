import "./SearchBar.css";

function SearchBar({ searchInput, setSearchInput, onSearch }) {
  return (
    <div className="search-container">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSearch();
        }}
      >
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Sök efter produkter..."
        />

        <button type="submit">Sök</button>
      </form>
    </div>
  );
}

export default SearchBar;