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
    public async Task<ActionResult<IEnumerable<Cocktails>>> GetAllCocktails()
    {
        var cocktails = await _context.Cocktails.ToListAsync();
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
