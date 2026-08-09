import { render, screen } from "@testing-library/react";
import Button from "./Button";

describe("Button Component", () => {
  test("renders button text", () => {
    render(<Button text="Click Me" />);
    expect(screen.getByRole("button")).toHaveTextContent("Click Me");
  });
});