namespace backend.Entities;

public class Cocktail
{
    public int Id { get; set; }
    public string ExternalId { get; set; } = null!; // ID dell'API esterna (es: TheCocktailDB)
    public string? Name { get; set; }
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}
