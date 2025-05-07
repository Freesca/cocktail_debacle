using Microsoft.AspNetCore.Mvc;
using backend.Data;
using backend.Entities;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using backend.DTOs;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using backend.Extensions;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CocktailsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public CocktailsController(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    // GET: /api/cocktails
    [HttpGet]

    public async Task<ActionResult<IEnumerable<CocktailDto>>> GetAllCocktails()
    {
        var cocktails = await _context.Cocktails
            .AsNoTracking()                    // lettura‑only → performance
            .Select(c => new CocktailDto
            {
                IdDrink        = c.IdDrink,
                StrDrink       = c.StrDrink,
                StrCategory    = c.StrCategory,
                StrAlcoholic   = c.StrAlcoholic,
                StrGlass       = c.StrGlass,
                StrInstructions = c.StrInstructions,
                StrDrinkThumb  = c.StrDrinkThumb,
    
                // INGREDIENTI (copiati 1‑1: puoi automatizzare con AutoMapper se preferisci)
                StrIngredient1  = c.StrIngredient1,
                StrIngredient2  = c.StrIngredient2,
                StrIngredient3  = c.StrIngredient3,
                StrIngredient4  = c.StrIngredient4,
                StrIngredient5  = c.StrIngredient5,
                StrIngredient6  = c.StrIngredient6,
                StrIngredient7  = c.StrIngredient7,
                StrIngredient8  = c.StrIngredient8,
                StrIngredient9  = c.StrIngredient9,
                StrIngredient10 = c.StrIngredient10,
                StrIngredient11 = c.StrIngredient11,
                StrIngredient12 = c.StrIngredient12,
                StrIngredient13 = c.StrIngredient13,
                StrIngredient14 = c.StrIngredient14,
                StrIngredient15 = c.StrIngredient15,
    
                // MISURE
                StrMeasure1  = c.StrMeasure1,
                StrMeasure2  = c.StrMeasure2,
                StrMeasure3  = c.StrMeasure3,
                StrMeasure4  = c.StrMeasure4,
                StrMeasure5  = c.StrMeasure5,
                StrMeasure6  = c.StrMeasure6,
                StrMeasure7  = c.StrMeasure7,
                StrMeasure8  = c.StrMeasure8,
                StrMeasure9  = c.StrMeasure9,
                StrMeasure10 = c.StrMeasure10,
                StrMeasure11 = c.StrMeasure11,
                StrMeasure12 = c.StrMeasure12,
                StrMeasure13 = c.StrMeasure13,
                StrMeasure14 = c.StrMeasure14,
                StrMeasure15 = c.StrMeasure15,
    
                UserId       = c.UserId ?? 0,          // se è nullable
                Popularity   = c.FavoritedBy.Count(),  // COUNT(*) via SQL, niente lazy‑load
                ReviewsCount = c.Reviews.Count()
            })
            .ToListAsync();
    
        return Ok(cocktails);
    }


    // GET: /api/cocktails/15346
    [HttpGet("{id}")]
    public async Task<ActionResult<Cocktails>> GetCocktailById(string id)
    {
        var cocktail = await _context.Cocktails.FindAsync(id);
        if (cocktail == null)
            return NotFound();

        return Ok(cocktail);
    }

    // POST: /api/cocktails/import
    [HttpPost("import")]
    public async Task<IActionResult> ImportCocktails()
    {
        var filePath = Path.Combine(_env.WebRootPath ?? "wwwroot", "data", "cocktails.json");

        if (!System.IO.File.Exists(filePath))
            return NotFound("File JSON non trovato.");

        try
        {
            var json = await System.IO.File.ReadAllTextAsync(filePath);
            var jsonDoc = JsonDocument.Parse(json);
            var drinks = jsonDoc.RootElement.GetProperty("drinks");

            var cocktails = JsonSerializer.Deserialize<List<Cocktails>>(drinks.GetRawText());

            if (cocktails == null || !cocktails.Any())
                return BadRequest("Nessun cocktail trovato nel file.");

            _context.Cocktails.AddRange(cocktails);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Importati {cocktails.Count} cocktail nel database." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Errore durante l'importazione: {ex.Message}");
        }
    }

    // GET: /api/cocktails/popular
    [HttpGet("popular")]
    public async Task<IActionResult> GetPopularCocktails()
    {
        var cocktails = await _context.Cocktails
            .Select(c => c.ToDto())  // Usa il metodo di estensione
            .ToListAsync();

        return Ok(cocktails);
    }


    // POST: /api/cocktails/upload-image
    [HttpPost("upload-image")]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("Nessun file ricevuto.");

        var permittedMimeTypes = new[] { "image/jpeg", "image/png", "image/webp" };
        if (!permittedMimeTypes.Contains(file.ContentType))
            return BadRequest("Formato immagine non supportato.");


        var uploadsFolder = Path.Combine(_env.WebRootPath!, "uploads");
        if (!Directory.Exists(uploadsFolder))
            Directory.CreateDirectory(uploadsFolder);

        var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var fileUrl = $"{Request.Scheme}://{Request.Host}/uploads/{fileName}";
        return Ok(new { url = fileUrl });
    }

    // POST: /api/cocktails/create
    [Authorize]
    [HttpPost("create")]
    public async Task<IActionResult> CreateCocktail([FromBody] CocktailDto dto)
    {
        var claimValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(claimValue))
            return Unauthorized("Claim utente mancante.");

        if (!int.TryParse(claimValue, out var userId))
            return Unauthorized("Claim utente non valido.");

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return NotFound("Utente non trovato.");

        var cocktail = dto.ToEntity(user);

        _context.Cocktails.Add(cocktail);
        await _context.SaveChangesAsync();

        return Ok(cocktail);
    }
}
